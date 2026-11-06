---
name: store-app
description: Build or change the shop side of this app, a quick-commerce store with three audiences (customers, the store admin, delivery partners). Covers the storefront (home, categories, product pages, search), cart and checkout, orders and live tracking, admin stock updates, the live order board, delivery assignment, invoices, store settings, and the delivery-partner screens. Use whenever the user mentions products, categories, cart, checkout, orders, stock or inventory, invoices, delivery boys or partners, the order board, store hours or fees, or the shop's pages and layout, even if they don't say "store" or name this skill. Not for sign-in, OTP or email verification (see docs/03, 06, 07).
---

# Store app

The app has three audiences who need different things from the same data:

- **Customers** browse, fill a cart, check out and track the order.
- **The admin** (the owner and staff) keeps stock and prices right, works the live order queue,
  hands orders to delivery partners and issues invoices.
- **Delivery partners** see only the orders assigned to them, with the details needed to find the
  customer and collect payment.

This skill exists so every session builds the same shop the same way. The rules below are short
because each one prevents a specific, expensive mistake; the references hold the detail.

## Read first

1. `src/convex/_generated/ai/guidelines.md`. Its Convex rules override what you remember.
2. `references/store-profile.md`: the facts about *this* store. Anything marked `TODO (dictate)`
   hasn't been decided. Don't invent a value: put it in one named constant, say so in your report,
   and ask the user when it matters (fees, hours, GST).
3. `references/roles-and-access.md`: who may call what. Read it before writing any function.
4. Then the side you're building: `references/customer.md`, `admin.md` or `delivery.md`. Open
   `references/payments.md` for online payment, UPI QR and refunds. Open
   `references/data-model.md` when adding or changing tables.

## Build order for a store that doesn't exist yet

1. Tables and access guards (`data-model.md`, `roles-and-access.md`)
2. Catalogue reads and customer browsing
3. Cart (guest and signed-in, merge on sign-in)
4. Checkout, `placeOrder`, orders and tracking
5. Admin: products and stock, then the order board, then delivery assignment
6. Delivery-partner screens
7. Invoices

Each step is usable and testable alone, and step 4 is where money and stock correctness live, so
everything after it can lean on it.

## Rules and why

- **Money is integer paise**, everywhere, including the database. Format only at the edge with
  `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. Floats drift and a
  ₹0.01 gap between the screen and the invoice becomes a dispute.
- **The server recomputes prices and checks stock at checkout.** The client's cart is a request, not
  a fact. Anyone can edit what the browser sends.
- **Every store function calls exactly one access guard** (public, customer, admin or delivery
  partner), and takes no `userId` argument. UI gating hides things; the guard is the security
  boundary. A page that checks and a function that doesn't is an open door.
- **Stock changes go through one helper** that also writes a `stockAdjustments` row. When the shelf
  and the app disagree, that log is the only way to find out why.
- **Orders snapshot names, prices and tax** into `orderItems`. Editing a product later must not
  rewrite old orders or invoices.
- **Public queries return only what a customer needs.** No cost data, no exact stock beyond a "only
  few left" threshold, no other users' anything.
- **Queries are bounded** (`.take()` or pagination) and use indexes. The orders table only grows.
- **"Today" is India time (IST, UTC+5:30).** Queries can't read the clock, so the client passes the
  day's start; mutations may use `Date.now()` (see `admin.md`).
- **Design for a cheap Android phone on slow 4G**: small lazy images with fixed aspect ratios, no
  heavy libraries, large tap targets, skeletons instead of spinners, and nothing that needs hover.
- **All UI text lives in `src/lib/store/strings.ts`** so Hindi can be added without touching
  components.
- **Screens use the app's UI kit** (`src/lib/ui`, colours from `src/themes/palette.css`, AGENTS.md),
  not another library's classes.
- **A public repo never holds the store's phone number or UPI id, or any real customer's data.**
  They are entered through the admin screens.
- **Use the store's own name, colours, copy and layout.** The mechanics (fast delivery, category
  grid, sticky cart bar, live status) are common to quick commerce; another company's branding,
  logo, palette and screens are not.

## Where code goes

| What | Where |
| --- | --- |
| Tables, validators | `src/convex/schema.ts`, `src/convex/store/validators.ts` |
| Customer functions | `src/convex/store/{catalog,cart,addresses,orders}.ts` |
| Admin / partner functions | `src/convex/store/admin/*.ts`, `src/convex/store/delivery.ts` |
| Pure helpers (pricing, time, invoices, access guards) | `src/convex/model/store/*.ts` |
| Components, cart state, strings | `src/lib/store/*` |
| Routes | `src/routes/` (customer), `src/routes/admin/*`, `src/routes/delivery/*` |

Reuse before writing: `authComponent.getAuthUser` / `safeGetAuthUser` (`src/convex/auth.ts`),
`requireAppAdmin` (`src/convex/model/admin/index.ts`), `optimizeImage`
(`src/lib/primitives/utils/optimizeImage.ts`), `gotoApp` and `safeRedirect`, the drawer, dialog and
tabs in `src/lib/primitives/ui/`, `createContext` as in `src/lib/auth/context.svelte.ts`, and
`@convex-dev/rate-limiter` (already mounted). New routes are private unless added to `isPublic` in
`src/hooks.server.ts`.

## Finish

- `pnpm check` and `npx tsc -p src/convex --noEmit` pass.
- If you touched access rules, prove them: a test per role showing the wrong role is refused
  (Vitest with `convex-test`, through a shared harness such as `src/convex/store/harness.testutils.ts`
  and guard stand-ins in `src/convex/vitest.setup.ts`), plus a Playwright spec in `tests/e2e` for the
  pages (`docs/09-testing.md`). Only tests that can fail when the behaviour breaks; none that restate
  a table, a string or static data.
- Report what you built, which `TODO (dictate)` values you assumed, and anything you left for later.
