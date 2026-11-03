# Store profile

The only file in this skill that is specific to a store. Everything else is generic, so a new
project fills in this one file and the rest of the skill just works.

Values marked **TODO (dictate)** haven't been decided: don't invent them. Put a placeholder in one
named constant (`src/lib/store/storeProfile.ts`, mirrored in the seeded `storeSettings` row), say
so in your report, and ask when it affects behaviour.

When starting a new store, ask the owner for these (or have them dictate), write the answers here,
then build. Keep known facts at the top and open questions in the table.

## What's known

- **Store**: **TODO (dictate)**: what it sells, where it is, how big the delivery area is.
- **Customers**: **TODO (dictate)**: who they are (families, students, offices), their phones and
  connectivity.
- **Model**: **TODO (dictate)**: own shelves and own delivery partners, or something else.
- **Currency**: INR, prices tax-inclusive, formatted with the `en-IN` locale.
- **Sign-in**: phone OTP first, email as a fallback (`docs/06-phone-otp.md`,
  `docs/07-email-verification.md`).
- **Payment now**: cash on delivery and UPI on delivery. Online payment comes later.
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
| Brand colours and logo | **TODO (dictate)** | Skeleton theme in `src/app.css` / `src/themes/` |
| Number of delivery partners at launch | **TODO (dictate)** | `/admin/delivery` seed |
| Store phone number for customers | **TODO (dictate)** | cancel/help text |
| UPI id (VPA) for payments | **TODO (dictate)** | UPI on delivery |
| GST: registered? GSTIN? composition scheme? | **TODO (dictate)**, confirm with the CA | invoice tax columns |
| Invoice prefix (≤ 3 letters, so numbers stay within 16 characters) | **TODO (dictate)** | invoice numbers |
| Legal name and address for invoices | **TODO (dictate)** | invoice header |
| Slots or ASAP only | **TODO (dictate)** | checkout "Delivery" block |
| Tips for delivery partners? How partners are paid? | **TODO (dictate)** | out of scope until answered |

When values are dictated, update this table first, then the code constants and the seed.
