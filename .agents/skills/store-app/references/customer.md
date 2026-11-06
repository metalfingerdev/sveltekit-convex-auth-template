# Customer side

Browsing is public so a visitor can fill a cart before signing in. Signing in is asked for at
checkout, phone-first, and the guest cart follows them.

## Routes

| Route | Access | Shows |
| --- | --- | --- |
| `/` | public | open/closed + ETA strip, search, category grid, shelves of featured products |
| `/c/[category]` | public | products in a category, sort and in-stock filter |
| `/p/[product]` | public | image, name, unit, price vs MRP, add-to-cart, "more in this category" |
| `/search?q=` | public | results from the product search index |
| `/cart` | public | the full cart page (also reachable as the cart drawer) |
| `/checkout` | signed in | address, slot, payment, summary, place order |
| `/orders` | signed in | my orders, newest first, paginated |
| `/orders/[id]` | signed in, owner | live status timeline, items, delivery code, partner contact |
| `/orders/[id]/invoice` | signed in, owner | printable invoice (shared with the admin copy, see `admin.md`) |
| `/account/addresses` | signed in | saved addresses |

Add the public ones to `isPublic` in `src/hooks.server.ts`, with the same pattern syntax it uses
(`'/c/{*rest}'`, `'/p/{*rest}'`). Everything else stays private by default. Keep the
patterns in `src/lib/store/publicRoutes.ts` (unit-tested) and spread them into `hooks.server.ts`;
`/cart` is public too, since a guest has a cart.

**Don't put the storefront pages in a route group** such as `(shop)`. A group renames route IDs
(`/` becomes `/(shop)`), and `resolve('/')` is used all over the app, so every one of those breaks.
Share a `ShopPage.svelte` (open/closed strip, search box) instead. Catalogue queries return
`stockLeft` only while `lowStock` is true, so "Only N left" works without exposing the real stock
otherwise. Replace the
placeholder `src/routes/+page.svelte`, and the "Svelte" wordmark in `src/routes/+layout.svelte`,
with the store's name from `store-profile.md`.

`/checkout` and `/orders*` redirect signed-out visitors through the existing
`/signin?redirectTo=` flow, so they land back where they were.

## Layout

Mobile first: design at 360px wide, then widen.

- **Header**: store name, an open/closed pill with the ETA ("Delivery in ~25 min"), a search field,
  the user menu. Keep the existing `UserButton`; add "Orders", and "Admin"/"Delivery" links from
  `myRoles` (`roles-and-access.md`).
- **Sticky cart bar** at the bottom whenever the cart has items: count, total, "View cart".
  It must not cover the last row of content, so pad the page by its height.
- **Category grid** on the home page: two or three columns of image + name tiles.
- **Product card**: a fixed-aspect image (no layout shift), name (2 lines max), unit label, price,
  MRP struck through with "% off" when `mrp > price`, and one control: **Add**, which becomes a
  **− qty +** stepper once in the cart. When `stock === 0` show "Out of stock" and no control.
  Show "Only N left" when stock is at or below the product's `lowStockAt`.
- **Cart drawer**: `src/lib/primitives/ui/drawer`, as a bottom sheet on mobile.
- **States**: skeletons while loading, an empty cart with a way back to the shelves, a "closed
  right now" banner (browsing allowed, checkout disabled), an offline banner.
- **Images**: product images come from Convex storage (`ctx.storage.getUrl`). Use `loading="lazy"`
  and explicit width/height. Resize on upload with `optimizeImage` (`admin.md`).

## Reading the catalogue

Public queries live in `src/convex/store/catalog.ts` and return a **public projection** (id, name,
slug, unitLabel, pricePaise, mrpPaise, imageUrl, `inStock`, `lowStock`, `maxPerOrder`), never the
raw document: no exact stock, no GST fields. Use the indexes in `data-model.md` and `.take(n)`.
Search uses `withSearchIndex('search_name', ...)` with `isActive = true`, bounded to a page.

## Cart

One class with runes in `src/lib/store/cart.svelte.ts`, provided through `createContext` (same
pattern as `src/lib/auth/context.svelte.ts`) from the root layout:

```ts
export class Cart {
	lines = $state<{ productId: string; quantity: number }[]>([]);
	count = $derived(this.lines.reduce((n, l) => n + l.quantity, 0));
	add(productId: string, max: number) {}
	setQuantity(productId: string, quantity: number, max: number) {} // 0 removes the line
	clear() {}
}
```

- **Guest**: lines in `localStorage` under a versioned key (`store.cart.v1`), every read and write in
  `try/catch` since storage can be blocked. Prices are *not* stored; look them up live so a stale
  cart never shows a stale price.
- **Signed in**: lines in `cartItems` through mutations in `src/convex/store/cart.ts`. Start with
  the live query and no optimistic updates (a joined cart query makes them fiddly); add them only if
  the delay shows on a slow connection.
- **Merge on sign-in**: when `useAuth().isAuthenticated` turns true and the guest cart isn't empty,
  call `mergeGuestCart({ lines })` once, then clear local storage. The mutation takes the **larger**
  quantity for products in both carts and clamps each to `min(stock, maxPerOrder)`. It must be
  idempotent: a repeated call with the same lines must not double the quantities. Why max, not sum:
  a lost response or a second tab makes the call run again, and a sum would double the quantities;
  max can't. Clear storage only after success.
- **Guest lines for products that vanish**: count them only until their details load, then ignore
  them. Query the guest's products with `keepPreviousData`, or the cart page flashes to its loading
  state on every tap.
- **Clamping**: the stepper stops at `min(stock, maxPerOrder)` and says why ("Only 3 available").
  The server clamps again.

## Pricing

A pure function in `src/convex/model/store/pricing.ts`, imported by both the cart UI and
`placeOrder`, so what's shown is what's charged:

```ts
export type PriceLine = { pricePaise: number; mrpPaise: number; quantity: number };
export type Fees = {
	deliveryFeePaise: number;
	freeDeliveryAbovePaise: number;
	smallCartFeePaise: number;
	smallCartBelowPaise: number;
};

export function priceCart(lines: PriceLine[], fees: Fees) {
	const subtotalPaise = lines.reduce((n, l) => n + l.pricePaise * l.quantity, 0);
	const mrpTotalPaise = lines.reduce((n, l) => n + l.mrpPaise * l.quantity, 0);
	const deliveryFeePaise = subtotalPaise >= fees.freeDeliveryAbovePaise ? 0 : fees.deliveryFeePaise;
	const smallCartFeePaise = subtotalPaise < fees.smallCartBelowPaise ? fees.smallCartFeePaise : 0;
	return {
		subtotalPaise,
		savingsPaise: mrpTotalPaise - subtotalPaise,
		deliveryFeePaise,
		smallCartFeePaise,
		totalPaise: subtotalPaise + deliveryFeePaise + smallCartFeePaise
	};
}
```

The fee values come from `storeSettings`. Show the breakdown in the cart ("Item total", "Delivery
fee", "Handling", "You save ₹X") and a progress hint toward free delivery ("Add ₹40 more for free
delivery").

## Checkout

One page, four blocks, a single primary button:

1. **Address**: pick a saved one or add one. The form adapts to `kind` (house: house/street +
   landmark; hostel: hostel/PG name, block, room; shop). `area` is a select from
   `storeSettings.deliveryAreas`; coverage is the named areas, not the pin, and an address outside
   them can't be saved ("We don't deliver there yet"). Phone is required and defaults to the
   signed-in number. **Whether a map pin is required is a store decision** (`store-profile.md`,
   Maps). When it is: the form opens with the pin picker in satellite view, starting at the
   customer's location, when a Maps key is set, and otherwise offers "Use my current location" and a
   link to check the pin on Google Maps; the server refuses a missing pin (`PIN_REQUIRED`) or one
   outside India (which also catches the 0,0 a failing phone reports); never block an order on the
   map loading; store only the customer's confirmed pin and their own edited text, not the
   geocoder's raw results (check Google's caching terms); accept the optional "Google Maps link" only
   for https Google Maps hosts, because the rider taps it (`isAllowedMapsUrl`); an older address
   without a pin gets "Add the pin" at checkout and `placeOrder` refuses it. From an open order the
   customer can "Send my current location" (`updateOrderPin`), which moves the order's pin and shows
   the rider when it moved.
2. **Delivery**: "As soon as possible (~N min)" or a slot list generated from the store's hours.
3. **Payment**: cash on delivery, UPI on delivery (a gateway QR fixed to the order total, shown by
   the rider or on the customer's order page), or pay online now through the payment gateway
   (`payments.md`). An online order waits as `awaiting_payment` until the gateway's signed webhook
   or a server-side status check confirms it, and is cancelled with its stock released if not paid
   within the payment window (a named constant).
4. **Summary**: lines, the `priceCart` breakdown, the minimum-order check.

**`placeOrder`** (`src/convex/store/orders.ts`, `requireCustomer`) takes the address id, slot,
payment method, a note and an **idempotency key** generated once when the page opens. In one
transaction it:

1. returns the existing order if `(userId, idempotencyKey)` already has one, so a double tap or a
   retry after a bad connection never creates two orders
2. checks the store is open now (`Date.now()` against the settings hours, plus the manual switch)
3. loads each product fresh; rejects inactive, unknown, over `maxPerOrder` or over-stock lines
4. prices with `priceCart` from the **database prices**, not anything the client sent
5. checks the minimum order and the delivery area
6. takes the next `order` number from `counters`, and a random 4-digit `deliveryCode`
7. inserts the order, `orderItems` snapshots and the first `orderEvents` row
8. calls `adjustStock` for each line (reason `sold`)
9. clears the user's `cartItems`

Failures throw `ConvexError({ code, ... })` with one of `STORE_CLOSED`, `STORE_NOT_SET_UP`,
`BELOW_MINIMUM` (`minOrderPaise`), `OUT_OF_AREA`, `PIN_REQUIRED` (when pins are required),
`INVALID_SLOT`, `EMPTY_CART`, `TOO_MANY_OPEN_ORDERS`, `CART_CHANGED` or `PRICE_CHANGED`
(`totalPaise`, the new total). The page turns each into a
"Review your cart" state that shows exactly what changed and lets the customer accept and retry;
never a bare error toast. Compare the total the customer saw (sent as `expectedTotalPaise`) with
the recomputed one, and throw `PRICE_CHANGED` if they differ.

`CART_CHANGED` carries `problems: [{ productId, reason, available }]` for **every** line that can't
be ordered as it is (`reason` is `unavailable`, `out_of_stock` or `over_limit`; `available` is the
most that can be ordered now), so the customer fixes the whole cart in one pass instead of
discovering problems one retry at a time. Read the cart from `cartItems` on the server, never from
the request, and run every check before the first write, so a refusal leaves nothing behind. Stock
changes in one place (`model/store/stock.ts`, `adjustStock`) and status in one place
(`model/store/orderStatus.ts`, `transitionOrder`).

## Orders and tracking

Checkout refuses nothing silently: a `describeCheckoutError` helper (`src/lib/store/checkoutErrors.ts`)
turns every `placeOrder` refusal into plain words and a next step, and an error it doesn't know gets
a calm "try again", never a raw message. Disable "Place order" for what the page can already see
(closed, no address, area no longer served, bad slot, below minimum), but the server stays the
authority.

- `/orders` is a paginated query (`paginationOptsValidator`) on `by_userId`, newest first.
- `/orders/[id]` uses `useQuery`, so the status updates live without polling. Show the
  `orderEvents` timeline with human labels from `strings.ts` ("Packed", "On the way"), the items,
  the totals, and an invoice link once delivered.
- The **delivery code** is shown prominently while the order is `out_for_delivery`, with "Tell this
  to your delivery partner when you receive your order".
- Once `out_for_delivery`, show the partner's first name and a tap-to-call link
  (`tel:`), not before.
- A customer may cancel only while `placed`. After that the screen says to call the store; the
  store's phone number comes from `storeSettings`/`store-profile.md`.
- Notifications are in-app only for now. SMS costs money per message and WhatsApp needs approved
  templates; add them deliberately, not by default.

## Accessibility and low-end phones

- Tap targets at least 44px; the stepper buttons most of all.
- Text contrast that survives sunlight; don't rely on colour alone for stock status.
- Keep the home page's JavaScript small: no carousel libraries, CSS scroll snap for shelves.
- Debounce search (250ms) and cancel stale requests.
