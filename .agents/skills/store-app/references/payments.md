# Online payments

Read this when adding UPI-on-delivery QR codes, pay-online at checkout or refunds. Razorpay is the
usual gateway in India; the pattern holds for any gateway.

- **Only the gateway marks an order paid.** A signed webhook (verify the HMAC with the webhook
  secret, in `src/convex/http.ts`, at `https://<deployment>.convex.site/<gateway>-webhook`) or a
  server-side status check. Never the browser, and never the delivery partner's word.
- **Keys are secrets**: Convex env vars per deployment (test keys on dev and staging), never the
  repo. One webhook per deployment, each with its own URL.
- **Payment window**: an online order waits as `awaiting_payment` with its stock held. Give it a
  named constant window plus a short grace, then cancel it and release the stock. Money that arrives
  after the cancel is refunded, not ignored.
- **UPI QR**: one gateway QR per order, single use, fixed to the order total, with a lifetime. A
  second request returns the live one instead of making another.
- **Refunds** go through `transitionOrder` so they are idempotent: a retried cancel or a repeated
  webhook must not refund twice. Track a refund state on the order (`refund`) and handle the
  `refund.processed` and `refund.failed` events.
- **Rows** while an action is in flight use a `creating` status, so a crash between "ask the
  gateway" and "save the answer" is visible and recoverable.
- Build a "check payment setup" action that tells the owner which env var is missing, and an admin
  page listing payments with their refund state.
