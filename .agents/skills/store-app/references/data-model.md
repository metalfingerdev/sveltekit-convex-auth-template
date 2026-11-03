# Data model

All tables go in `src/convex/schema.ts`; shared validators in `src/convex/store/validators.ts`
so function args and the schema can't drift. Follow the Convex guidelines: index names include
every field (`by_a_and_b`), no unbounded arrays in a document, no `.collect()` on growing tables.

**Money is integer paise** in every `...Paise` field. Validate with `Number.isInteger` in the
mutations that write them.

User ids are Better Auth ids (`user._id`, a string), not `v.id(...)`, since users live in the
`betterAuth` component.

## Validators

```ts
export const orderStatus = v.union(
	v.literal('placed'),
	v.literal('accepted'),
	v.literal('packed'),
	v.literal('out_for_delivery'),
	v.literal('delivered'),
	v.literal('delivery_failed'), // partner couldn't deliver; admin decides what happens next
	v.literal('cancelled')
);
export const paymentMethod = v.union(v.literal('cod'), v.literal('upi_on_delivery'));
export const paymentStatus = v.union(v.literal('pending'), v.literal('paid'), v.literal('refunded'));
```

Online payment (a gateway) is a later step. Until then both methods are collected at the door, and
`paymentStatus` becomes `paid` when the partner confirms collection.

## Tables

```ts
categories: defineTable({
	name: v.string(),
	slug: v.string(),
	imageId: v.optional(v.id('_storage')),
	sortOrder: v.number(),
	isActive: v.boolean()
})
	.index('by_slug', ['slug'])
	.index('by_isActive_and_sortOrder', ['isActive', 'sortOrder']),

products: defineTable({
	categoryId: v.id('categories'),
	name: v.string(),
	slug: v.string(),
	unitLabel: v.string(), // "1 kg", "500 ml", "6 pcs"
	pricePaise: v.number(), // selling price, tax-inclusive
	mrpPaise: v.number(), // printed MRP; >= pricePaise
	stock: v.number(), // whole units on the shelf
	lowStockAt: v.optional(v.number()),
	maxPerOrder: v.number(),
	isActive: v.boolean(), // false hides it from customers
	isFeatured: v.boolean(),
	imageId: v.optional(v.id('_storage')),
	gstRatePercent: v.optional(v.number()), // only used when the store has a GSTIN
	hsn: v.optional(v.string())
})
	.index('by_slug', ['slug'])
	.index('by_categoryId_and_isActive', ['categoryId', 'isActive'])
	.index('by_isFeatured_and_isActive', ['isFeatured', 'isActive'])
	.searchIndex('search_name', { searchField: 'name', filterFields: ['isActive', 'categoryId'] }),

// A signed-in customer's cart. Guests keep theirs in localStorage (customer.md).
cartItems: defineTable({
	userId: v.string(),
	productId: v.id('products'),
	quantity: v.number()
}).index('by_userId_and_productId', ['userId', 'productId']),

addresses: defineTable({
	userId: v.string(),
	label: v.string(), // "Home", "Hostel", "Shop"
	kind: v.union(v.literal('house'), v.literal('hostel'), v.literal('shop')),
	line1: v.string(), // house no. / hostel and room / shop name
	area: v.string(), // one of storeSettings.deliveryAreas
	landmark: v.optional(v.string()),
	contactName: v.string(),
	contactPhone: v.string(), // E.164
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	isDefault: v.boolean()
}).index('by_userId', ['userId']),

orders: defineTable({
	orderNumber: v.number(), // short, human-friendly, from the `order` counter
	userId: v.string(),
	idempotencyKey: v.string(), // one per checkout attempt; makes placeOrder safe to retry
	status: orderStatus,
	paymentMethod,
	paymentStatus,
	subtotalPaise: v.number(),
	savingsPaise: v.number(),
	deliveryFeePaise: v.number(),
	smallCartFeePaise: v.number(),
	totalPaise: v.number(),
	// Snapshot of the address used for delivery; later edits to the saved address don't change it
	address: v.object({
		kind: v.union(v.literal('house'), v.literal('hostel'), v.literal('shop')),
		line1: v.string(),
		area: v.string(),
		landmark: v.optional(v.string()),
		contactName: v.string(),
		contactPhone: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number())
	}),
	slotStartMs: v.optional(v.number()), // unset means "as soon as possible"
	customerNote: v.optional(v.string()),
	deliveryCode: v.string(), // 4 digits; shown to the customer, typed by the partner
	assignedPartnerId: v.optional(v.id('deliveryPartners')),
	deliveredAt: v.optional(v.number()),
	invoiceNumber: v.optional(v.string()),
	cashCollectedPaise: v.optional(v.number()),
	cashSettledAt: v.optional(v.number()) // admin received this cash from the partner
})
	.index('by_userId', ['userId'])
	.index('by_userId_and_idempotencyKey', ['userId', 'idempotencyKey'])
	.index('by_orderNumber', ['orderNumber'])
	.index('by_status', ['status'])
	.index('by_assignedPartnerId_and_status', ['assignedPartnerId', 'status']),

orderItems: defineTable({
	orderId: v.id('orders'),
	productId: v.id('products'),
	// Snapshots: later edits to the product must not change this order or its invoice
	name: v.string(),
	unitLabel: v.string(),
	unitPricePaise: v.number(),
	mrpPaise: v.number(),
	quantity: v.number(),
	gstRatePercent: v.optional(v.number()),
	hsn: v.optional(v.string())
}).index('by_orderId', ['orderId']),

// The timeline customers see and the admin audits
orderEvents: defineTable({
	orderId: v.id('orders'),
	status: orderStatus,
	actorKind: v.union(v.literal('customer'), v.literal('admin'), v.literal('partner'), v.literal('system')),
	actorId: v.optional(v.string()),
	note: v.optional(v.string())
}).index('by_orderId', ['orderId']),

stockAdjustments: defineTable({
	productId: v.id('products'),
	delta: v.number(), // negative for sales and write-offs
	stockAfter: v.number(),
	reason: v.union(
		v.literal('received'),
		v.literal('sold'),
		v.literal('order_cancelled'),
		v.literal('damaged'),
		v.literal('correction')
	),
	orderId: v.optional(v.id('orders')),
	actorId: v.optional(v.string())
}).index('by_productId', ['productId']),

deliveryPartners: defineTable({
	name: v.string(),
	phoneNumber: v.string(), // E.164, matched against the user's verified phone
	isActive: v.boolean()
}).index('by_phoneNumber', ['phoneNumber']),

// Exactly one document. Read it with a plain `.first()`.
storeSettings: defineTable({
	storeName: v.string(),
	isOpen: v.boolean(), // the manual open/closed switch
	opensAtMinute: v.number(), // minutes after midnight IST
	closesAtMinute: v.number(),
	etaMinutes: v.number(),
	deliveryAreas: v.array(v.string()), // small, bounded list
	minOrderPaise: v.number(),
	deliveryFeePaise: v.number(),
	freeDeliveryAbovePaise: v.number(),
	smallCartFeePaise: v.number(),
	smallCartBelowPaise: v.number(),
	upiVpa: v.optional(v.string()),
	// Invoice details. gstin unset means "no tax breakdown on invoices"
	legalName: v.string(),
	addressLine: v.string(),
	gstin: v.optional(v.string()),
	invoicePrefix: v.string()
}),

// Sequences: `order`, and `invoice:<financial year>` (e.g. `invoice:26-27`)
counters: defineTable({ key: v.string(), value: v.number() }).index('by_key', ['key']),
```

Why a few choices:

- **`cartItems` without a `carts` table**: nothing belongs to a cart as a whole yet. Add one when
  it does (coupons, a saved delivery address).
- **`orderItems` and `orderEvents` as child tables**, not arrays inside `orders`: an order can grow
  events, and the guidelines forbid unbounded arrays in a document.
- **`counters`** is one hot document, which is fine at one store's order rate. If writes ever
  contend, shard it or use `@convex-dev/sharded-counter`; sequential invoice numbers are the reason
  not to start with something looser.
- **Partners by phone** is explained in `roles-and-access.md`.

## State machine

```
placed ──▶ accepted ──▶ packed ──▶ out_for_delivery ──▶ delivered
  │           │            │               │
  └───────────┴────────────┘               └──▶ delivery_failed ──▶ (admin) cancelled / re-assign
             └──▶ cancelled
```

| Transition | Who | Side effects |
| --- | --- | --- |
| placed | customer (`placeOrder`) | stock decremented, `sold` adjustments, delivery code, event |
| placed → accepted, accepted → packed | admin | event |
| any before `out_for_delivery` → cancelled | customer only while `placed`; admin any time | stock restored (`order_cancelled`), event with a reason |
| packed → out_for_delivery | assigned partner, or admin | needs `assignedPartnerId` |
| out_for_delivery → delivered | assigned partner, with the correct code | `deliveredAt`, `cashCollectedPaise`, `paymentStatus: paid`, invoice number |
| out_for_delivery → delivery_failed | assigned partner, with a reason | event |
| delivery_failed → cancelled / packed | admin | restore stock on cancel; re-assign on retry |

Put the allowed-transition table in code (`model/store/orderStatus.ts`) and make every status
mutation go through one `transitionOrder` helper that checks it, writes the event, and runs the side
effects. Scattered `ctx.db.patch(orderId, { status })` calls are how orders end up delivered and
cancelled at once.

## Stock helper

```ts
// model/store/stock.ts: the only code that patches products.stock
export async function adjustStock(ctx: MutationCtx, args: { productId, delta, reason, orderId?, actorId? }) {
	const product = await ctx.db.get(args.productId);
	if (!product) throw new ConvexError('Product not found');
	const stockAfter = product.stock + args.delta;
	if (stockAfter < 0) throw new ConvexError({ code: 'OUT_OF_STOCK', productId: args.productId });
	await ctx.db.patch(args.productId, { stock: stockAfter });
	await ctx.db.insert('stockAdjustments', { ...args, stockAfter });
}
```

Convex mutations are transactions, so a failed adjustment rolls back the whole `placeOrder`.
