# Admin side

The admin runs the store from a phone behind the counter as often as from a laptop. Design for
one-handed use and a busy hour: big tap targets, few steps, nothing that needs a mouse. Every
function here starts with `requireAppAdmin(ctx)` (`roles-and-access.md`).

## Routes

| Route | Shows |
| --- | --- |
| `/admin` | **Live order board** (the page an admin lands on) |
| `/admin/orders` | all orders, filter by status/date, paginated |
| `/admin/orders/[id]` | one order: items, address, payment, timeline, actions, invoice |
| `/admin/orders/[id]/invoice` | printable invoice |
| `/admin/products` | stock and price editing, create/edit product |
| `/admin/categories` | create/reorder/hide categories |
| `/admin/delivery` | partners, who is out, cash to settle |
| `/admin/settings` | hours, open/closed switch, fees, areas, invoice details |
| `/admin/users` | the existing user and organization dashboard |

The starter's user-management dashboard currently *is* `/admin` (`src/routes/admin/+page.svelte`,
`ADMIN_ROUTE` in `src/lib/admin/utils/admin.constants.ts`, and the `AdminDashboard` component).
Moving it to `/admin/users` means: move the page, add the new board at `/admin`, and grep for
`ADMIN_ROUTE` and `AdminButton` to update every link and `redirectTo`. Keep its access check.

A shared `src/routes/admin/+layout.svelte` holds the nav (a bottom tab bar on mobile, a sidebar on
desktop; `src/lib/primitives/ui/Sidebar.svelte` exists) and the access check, so each page doesn't
repeat it.

## Live order board (`/admin`)

Columns by status: **New** (`placed`), **Accepted**, **Packed**, **Out for delivery**; delivered
and cancelled orders drop off the board. One `useQuery` on `by_status` per active status, each
`.take(50)`, so the board is live without polling.

- Order card: number, age ("4 min ago"), item count, total, area, payment method, COD amount.
- **New-order alert**: a toast, the tab title flashing "(2) New order", and an optional sound.
  Browsers block audio until the user interacts, so add an "Enable alerts" switch that plays a
  short sound when turned on, and remember it in `localStorage` (in `try/catch`).
- One-tap actions on the card: **Accept**, **Reject** (asks for a reason), **Mark packed**,
  **Assign partner** (a select of active partners, then it moves to out for delivery when the
  partner or admin starts the run).
- Highlight orders that sit too long in a column (for example > 5 min in New).

All status changes go through `transitionOrder` (`data-model.md`).

## Stock and products (`/admin/products`)

The most-used screen after the board, so speed matters:

- A searchable list with each row showing image, name, unit, price, **stock** and an in-stock
  toggle. Filters: low stock, out of stock, hidden.
- **Inline stock editing**: − / + buttons and a number field. "Received 24" (a delta) and "Set to
  18" (a correction) are different intents; offer both, as they produce different
  `stockAdjustments` reasons (`received` vs `correction`).
- Every stock change calls `adjustStock` with the admin's id. No other code patches `stock`.
- Create/edit form: name, category, unit label, selling price, MRP (must be ≥ price), stock, low-stock
  level, max per order, featured, active, optional GST rate and HSN, image.
- Prices are entered in rupees in the UI and converted to paise at the boundary
  (`Math.round(rupees * 100)`), and the form rejects more than two decimals.

**Images**: the existing `src/convex/storage.ts` `generateUploadUrl` lets *any signed-in user*
upload. Don't use it for products. Add `store/admin/products.generateImageUploadUrl` guarded by
`requireAppAdmin`. On the client, shrink the file first with `optimizeImage`
(`src/lib/primitives/utils/optimizeImage.ts`), upload it, then save the returned storage id on the
product. When replacing an image, delete the old one with `ctx.storage.delete`.

## Orders (`/admin/orders`)

- Filters: status, date range, payment method, partner. Use the indexes in `data-model.md`; a date
  range needs `by_creation_time` bounds, not a client-side filter.
- Detail page: customer name and phone (tap-to-call), the address snapshot, items, totals, the
  `orderEvents` timeline, and the actions valid for the current status.
- **Cancel** asks for a reason and restores stock through `adjustStock` (`order_cancelled`).
- **Failed delivery** (`delivery_failed`) asks the admin to either re-assign (back to `packed`) or
  cancel and restock.

## Delivery management (`/admin/delivery`)

- Add a partner by name and mobile (normalise with `normalizeIndianMobile` from
  `src/convex/otp/phone.ts`); toggle `isActive` to deactivate without deleting history.
- Show each partner's current runs and today's deliveries.
- **Cash settlement**: for a partner and a day, list orders with `cashCollectedPaise` and no
  `cashSettledAt`, show the total, and a "Mark settled" action that sets `cashSettledAt` on all of
  them in one mutation. The total on screen must equal what the partner was told to hand over.

## Settings (`/admin/settings`)

Edits the single `storeSettings` document: the open/closed switch (for "we're closing early"), hours,
ETA, delivery areas, fees and thresholds, minimum order, UPI id, and invoice details (legal name,
address, GSTIN, prefix). Validate: closing after opening, non-negative integers in paise, a GSTIN
matching its 15-character shape if present.

## "Today" and the clock

Queries can't read the clock. For "today's orders" the page computes the start of the day in IST
and passes it in:

```ts
export const istDayStartMs = (nowMs: number) => {
	const IST = 5.5 * 60 * 60 * 1000;
	return Math.floor((nowMs + IST) / 86_400_000) * 86_400_000 - IST;
};
```

Put it in `src/convex/model/store/time.ts` so server and client share it. Mutations may call
`Date.now()`.

## Invoices

An invoice number is assigned in the mutation that marks the order **delivered**, never earlier,
so cancelled orders don't leave gaps in the sequence.

- Format `<prefix>/<financial year>/<6-digit sequence>`, for example `ABC/26-27/000123` (a prefix of at most 3 letters keeps it within 16 characters). The sequence
  comes from the `invoice:<financial year>` counter, incremented in the same transaction. The
  financial year runs 1 April to 31 March in IST: `financialYear(ms)` in `model/store/invoice.ts`
  returns `'26-27'` for 15 Nov 2026.
- Keep the whole number to **16 characters or fewer** (a GST requirement for registered sellers).
- The printable page uses print CSS (`@media print`, A4 and a narrow receipt variant), so "Print →
  Save as PDF" works and no PDF library is needed. Contents: store legal name, address, GSTIN if
  any, invoice number and date, order number, customer name and address, a line table (item, unit,
  qty, rate, amount), totals, payment method, and "Thank you".
- **Tax**: retail prices in India are MRP-inclusive, so the tax is *inside* the price, never added
  on top. For a line with rate r% and inclusive amount A, tax = `Math.round(A * r / (100 + r))`
  and taxable value = A − tax. Compute per line, show CGST/SGST halves (the store and customers
  are in the same state), and make the lines sum exactly to the order total. Show the breakdown
  **only when `gstin` is set** in `storeSettings`; otherwise print a plain bill of supply style
  invoice without tax columns.
- Don't assert legal requirements in the UI or docs. Which items are taxed, whether the store is
  registered or under the composition scheme, and the exact invoice wording are the store's
  accountant's call. Ask the user to confirm with their CA before the first real invoice.
- Invoices are immutable once issued. A correction is a new credit note, not an edit.
- The customer's `/orders/[id]/invoice` and the admin's use the same component; the query checks
  ownership for customers and admin rights for the admin.

## Reports (keep small)

A "Today" strip on the board: orders, revenue (delivered only), items sold, cash to settle. Use
bounded queries on the day's orders, with the IST day start passed in. Anything heavier, like
sales by category or weekly trends, should use `@convex-dev/aggregate` rather than scanning orders.
