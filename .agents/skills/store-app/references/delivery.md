# Delivery-partner side

A delivery partner is outdoors, on a cheap phone, often on one hand and a weak connection. They
need exactly what gets an order to the right door and the right payment collected, and nothing
else. Every function starts with `requireDeliveryPartner(ctx)` and returns a **purpose-built
projection** (`roles-and-access.md`), never the raw order.

## How partners get in

The admin adds the partner's mobile number in `/admin/delivery`. The partner signs in at `/signin`
with the usual phone OTP, and `myRoles` shows them a "Delivery" entry (and a banner on the home
page) leading to `/delivery`. The first time, the sign-in name step asks for their name; the
`deliveryPartners.name` the admin typed is what the store sees.

## Routes

| Route | Shows |
| --- | --- |
| `/delivery` | my active runs, today's completed, cash I owe the store |
| `/delivery/orders/[id]` | everything for one order, and the actions |

A shared `src/routes/delivery/+layout.svelte` does the access check and has a simple top bar with
the partner's name and sign out. No store browsing, no cart, no marketing.

## `/delivery`

Three sections, newest first, each bounded:

1. **To pick up** (`packed`, assigned to me): order number, item count, area, amount to collect.
2. **On the way** (`out_for_delivery`): same, plus the customer's area.
3. **Today**: completed count and the **cash to hand over** total, from orders delivered since the
   IST day start (passed in as an argument) with `cashCollectedPaise` and no `cashSettledAt`. It
   must equal what the admin sees in `/admin/delivery` for that partner.

The list updates live (`useQuery`), so an order the admin just assigned appears without a refresh.
Show a toast and a vibration (`navigator.vibrate`, guarded) for a new assignment.

## `/delivery/orders/[id]`

What is special to partners, in the order they need it:

- **Amount to collect**, large: "Collect ₹X cash" / "Collect ₹X by UPI" / "Already paid".
- **Customer**: first name and a **tap-to-call** button (`tel:`).
- **Address**: hostel/house line, area, **landmark**, and a **Maps** button (where the store uses pins, also a small fixed satellite view of the pin that follows
  it if the customer moves it, noting when; an order without a pin says so: call first). With coordinates use
  `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`; without, search the address
  text. Urlencode everything.
- **Customer's note** (for example "Call at the gate").
- **Items checklist** at pickup, with quantities, so they can tick items off. Tick state is local.
- A **timeline** of what happened so far.

Privacy: the phone number and address are returned **only** while the order is assigned to this
partner and not yet finished. After `delivered`, the phone is masked to its last 4 digits and the
address drops to the area. After `cancelled`, they disappear.

## Actions

| Action | From → to | Needs |
| --- | --- | --- |
| **Picked up, start delivery** | `packed` → `out_for_delivery` | assigned to me |
| **Delivered** | `out_for_delivery` → `delivered` | the customer's 4-digit code, and the collected amount for COD/UPI |
| **Couldn't deliver** | `out_for_delivery` → `delivery_failed` | a reason from a short list (not reachable, address not found, refused, other) |

All go through `transitionOrder` and write an `orderEvents` row with `actorKind: 'partner'`.

**The delivery code** is what makes "delivered" trustworthy. The partner types the 4 digits the
customer reads out; the mutation compares against `orders.deliveryCode`. Never return the code to
the partner. Limit wrong attempts with `@convex-dev/rate-limiter` (for example 5 per order per 10
minutes), or four digits can be guessed in a few taps.

A wrong code is returned as a result (`{ ok: false, reason: 'WRONG_CODE' }`), not thrown: a thrown
error rolls back the rate limiter's counter and the limit would never trip.

**UPI is never the partner's word.** While an order is unpaid, "Delivered" needs the partner to
confirm they collected the cash (`paidWith: 'cash'`, which sets `cashCollectedPaise`, what they owe
the store). A customer paying by UPI scans the gateway's QR fixed to the order total; only the
gateway's signed webhook, or a status check against it, marks the order paid, and the partner's
screen shows "Paid by UPI" live. Claiming UPI on an unpaid order is refused (`UPI_NOT_CONFIRMED`).
See `payments.md`.

On success the mutation sets `deliveredAt`, `paymentStatus: 'paid'` and, for cash,
`cashCollectedPaise`, and assigns the invoice number (`admin.md`).

## Resilience

- Large buttons and one primary action per screen; confirm dialogs for the irreversible ones
  ("Mark delivered?").
- A visible "Offline" banner. Mutations should fail clearly rather than silently queue. Don't let a
  partner believe an order is marked delivered when it isn't; show the pending/failed state on the
  button until the server confirms.
- High-contrast, no hover-only affordances, text that works at 200% zoom.
- Keep the bundle tiny; this route shouldn't load the storefront code.

## Not in scope yet

Live location sharing, route optimisation, partner earnings and payouts, and multiple orders per
run. Add them when the store asks.
