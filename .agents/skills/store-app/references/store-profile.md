# Store profile: <store name>

The only file in this skill that is specific to a store. Everything else is generic, so a new
project fills in this one file and the rest of the skill just works.

Values marked **TODO (dictate)** haven't been decided: don't invent them. Put a placeholder in one
named constant (`src/convex/model/store/storeProfile.ts`: Convex code imports it, the frontend
reaches it as `#convex/model/store/storeProfile.js`, and the seed copies it into the
`storeSettings` row; mirrored in the seeded `storeSettings` row), say
so in your report, and ask when it affects behaviour.

When starting a new store, ask the owner for these (or have them dictate), write the answers here,
then build. Keep known facts at the top and open questions in the table. Write each dictated value
as **Decided**: ... (or ... (proposed) until the owner agrees).

## What's known

- **Store**: **TODO (dictate)**: what it sells, where it is, how big the delivery area is.
- **Customers**: **TODO (dictate)**: who they are (families, students, offices), their phones and
  connectivity.
- **Model**: **TODO (dictate)**: own shelves and own delivery partners, or something else.
- **Currency**: INR, prices tax-inclusive, formatted with the `en-IN` locale.
- **Sign-in**: phone OTP first, email as a fallback (`docs/06-phone-otp.md`,
  `docs/07-email-verification.md`).
- **Payment**: **TODO (dictate)**: cash on delivery, UPI on delivery, online through a gateway.
- **Environments**: **TODO (dictate)**: which site is staging and which is the real store, and
  where the real domain will live (`docs/08-environments-and-deployment.md`).
- **People**: **TODO (dictate)**: who is the admin, who delivers.

## To dictate

| Item | Value | Used for |
| --- | --- | --- |
| Name on the shop signboard | **TODO (dictate)** | header, invoices, SMS text |
| Opening and closing time (IST) | **TODO (dictate)** | `opensAtMinute`/`closesAtMinute`, checkout gate |
| Typical delivery time | **TODO (dictate)** | `etaMinutes`, the header pill |
| Delivery areas | **TODO (dictate)** | `deliveryAreas`, address form |
| Delivery fee, free-delivery threshold | **TODO (dictate)** | `priceCart` |
| Small-cart fee and its threshold | **TODO (dictate)** | `priceCart` |
| Minimum order | **TODO (dictate)** | checkout check |
| Product categories to start with | **TODO (dictate)** | seed data, home grid |
| Languages in the UI | **TODO (dictate)** | `strings.ts` |
| Brand colours and logo | **TODO (dictate)** | `src/themes/palette.css` |
| Number of delivery partners at launch | **TODO (dictate)** | `/admin/delivery` seed |
| Store phone number for customers | **TODO (dictate)** | cancel/help text |
| UPI id (VPA) for payments | **TODO (dictate)** | UPI on delivery |
| GST: registered? GSTIN? composition scheme? | **TODO (dictate)**, confirm with the CA | invoice tax columns |
| Invoice prefix (≤ 3 letters, so numbers stay within 16 characters) | **TODO (dictate)** | invoice numbers |
| Legal name and address for invoices | **TODO (dictate)** | invoice header |
| Slots or ASAP only | **TODO (dictate)** | checkout "Delivery" block |
| Map pin required on every address? Who owns the Maps key and its daily quota? | **TODO (dictate)** | address form, `PIN_REQUIRED` |
| Payment gateway account, KYC status, live keys, payment window | **TODO (dictate)** | `payments.md` |
| Design direction and inspiration (mechanics, never another company's branding) | **TODO (dictate)** | UI design record below |
| How products get in: one by one in admin, CSV import, both | **TODO (dictate)** | `admin.md` |
| May customers phone their delivery partner? | **TODO (dictate)** | order page |
| Where real values (phone, UPI id, invoice details) are entered | **TODO (dictate)** | admin settings, never the repo |
| Tips for delivery partners? How partners are paid? | **TODO (dictate)** | out of scope until answered |

When values are dictated, update this table first, then the code constants and the seed.

## Decisions already made (don't re-ask)

Record each decision with its *why*, so a later session does not reopen it.

- **Direction**: **TODO (dictate)**
- **Who delivers, and how they find the door**: **TODO (dictate)**
- **Maps**: **TODO (dictate)**
- **Payment**: **TODO (dictate)**
- **Tests**: **TODO (dictate)** (default: `docs/09-testing.md`, only real tests)
- **Workflow**: **TODO (dictate)**: branches, pull requests, who merges, what deploys
- **Real values via admin, not the repo**: **TODO (dictate)**
- **Products intake**: **TODO (dictate)**

## Status (what exists)

- **Built**: nothing yet.
- **Not built (as of <date>)**: everything in the roadmap below.

## Roadmap (agreed order; each step its own pull request)

Start from the build order in `SKILL.md`, then agree the real order with the owner. For each step
write what it needs from the owner.

1. **TODO (dictate)**: step. *Needs from the owner:* ...

Per-step notes go below as `## Step N: <name> (built)`, with the files and functions it added.

## Design record

Storefront design, decided with the owner (<date>). One decision per area, each with its *Why*:
header, colours, borders, grids, cards, skeletons, image stand-ins, cart, checkout, confirmations,
account menu, rider screens, admin screens. **TODO (dictate)**

## Smaller items, any time

- **TODO (dictate)**
