# 06 – Phone sign-in (OTP, WhatsApp, Truecaller)

Indian quick-commerce users expect to sign in with a mobile number, not an email. This doc covers
how phone sign-in is built and the three-phase plan for delivering codes.

| Phase | Channel | Status | Why |
| --- | --- | --- | --- |
| 1 | **textbee.dev**: SMS sent from an Android phone's SIM | ✅ Built, enabled on dev | Works today, no DLT paperwork, almost free at low volume |
| 2 | **WhatsApp** OTP (Meta Cloud API) | 🟡 Channel written, untested | No SMS/DLT. Most Indian users have WhatsApp |
| 2 | **Truecaller** one-tap | ⚪ Designed, not built | No code at all: Truecaller has already verified the number |
| 3 | **Fast2SMS**, a DLT-registered SMS gateway | 🟡 Channel written, untested | Throughput and deliverability at scale. The legally compliant SMS path |

## Architecture

```
 Browser                          Convex (HTTP action)                         Providers
 ───────                          ────────────────────                         ─────────
 authClient.phoneNumber           Better Auth phoneNumber plugin
   .sendOtp({ phoneNumber }) ───▶   generates code, stores it in      
                                    `verification` (5 min, 3 tries)
                                    calls sendOTP() ──▶ otp/send.ts  sendOtp()
                                                          1. validate +91 number
                                                          2. rate limit (per phone, global)
                                                          3. for channel in OTP_CHANNELS:
                                                               skip if not configured
                                                               channel.send() ─────────────▶ textbee / WhatsApp / Fast2SMS
                                                               log to otpDeliveries
                                                               first success → return
                                                          4. all failed → error to client
 authClient.phoneNumber
   .verify({ phoneNumber, code }) ─▶ plugin checks code, signs in
                                    (creates the user on first sign-in)
```

**The split that matters:** Better Auth's `phoneNumber` plugin owns the OTP: generating it,
storing it, expiry, attempt counting, sign-up and sessions. `src/convex/otp/` only *delivers*
it. So:

- Adding a provider never touches security-sensitive code. It's one file implementing `OtpChannel`.
- Switching providers is an env var change (`OTP_CHANNELS`), not a deploy.
- Several channels can run as an ordered fallback chain (e.g. WhatsApp first, then SMS).

Truecaller (phase 2) is the exception: it doesn't deliver a code, so it isn't a channel. See
[Phase 2](#phase-2-whatsapp--truecaller).

### Files

```
src/convex/otp/
├── send.ts          # sendOtp(): the dispatcher (rate limit → channels → log)
├── config.ts        # OTP length/expiry/attempts, OTP_CHANNELS parsing, SMS text, placeholder email
├── phone.ts         # normalizeIndianMobile / isValidIndianMobile (pure, also used by the frontend)
├── rateLimits.ts    # @convex-dev/rate-limiter definitions
├── deliveries.ts    # internal mutation that writes the otpDeliveries audit log
├── types.ts         # OtpChannel interface, DeliveryResult
├── truecaller.ts    # Phase 2 contract (stub)
└── channels/
    ├── index.ts     # registry: id → channel
    ├── textbee.ts   # Phase 1
    ├── whatsapp.ts  # Phase 2
    ├── fast2sms.ts  # Phase 3
    └── console.ts   # dev only: prints the code to Convex logs
```

Touched elsewhere:

| File | Change |
| --- | --- |
| `convex/auth.ts` | `phoneNumber()` plugin, behind `AUTH_CONSTANTS.providers.phoneOTP` |
| `convex/auth.constants.types.ts` | `phoneOTP?: boolean` flag |
| `convex/convex.config.ts` | mounts `@convex-dev/rate-limiter` |
| `convex/schema.ts` | `otpDeliveries` table |
| `convex/betterAuth/generatedSchema.ts` | `user.phoneNumber`, `user.phoneNumberVerified`, `phoneNumber` index |
| `lib/auth/api/auth-client.ts` | `phoneNumberClient()` behind the same flag |
| `lib/auth/ui/PhoneOtpFlow.svelte` | Phone → code → name sign-in flow |
| `lib/auth/ui/SignIn.svelte` | Opens on the phone step when the flag is on |

### Phone number format

Every number is stored and sent as E.164 Indian mobile: `+91` + 10 digits starting 6–9. The
server's `phoneNumberValidator` rejects anything else, so the **client must normalize first**:

```ts
import { normalizeIndianMobile } from '#convex/otp/phone.js';

normalizeIndianMobile('098765 43210'); // '+919876543210'
normalizeIndianMobile('+1 415 555 0100'); // null → show "enter a valid mobile number"
```

This is what stops `9876543210` and `+91 98765-43210` from becoming two accounts. To support
other countries later, widen `isValidIndianMobile` and add a country picker. The channels already
take E.164.

### Accounts created by phone

Better Auth requires an email on every user. A phone-only sign-up gets the placeholder
`919876543210@phone.invalid` (`.invalid` is a reserved TLD, so nothing can be delivered there) and
its name is set to the phone number. Prompt for a real name after first sign-in. `sendEmails` is
on, and `convex/email.ts` skips every send to an `.invalid` address
([07 – Email verification](./07-email-verification.md#phone-sign-ups-and-placeholder-emails)).

Users who signed up by email can add a phone through the plugin's `updateUser`/verify flow. The
`phoneNumber` field is unique, so one number belongs to one account.

### Rate limits (`otp/rateLimits.ts`)

Every send costs money, and OTP endpoints attract **SMS pumping** (bots requesting codes to
premium-rate numbers) and harassment (flooding someone's phone). Better Auth's built-in rate
limiter doesn't protect us inside Convex, so these do:

| Limit | Default | Notes |
| --- | --- | --- |
| `otpPerPhone` | 3 per 10 min (token bucket) | Resend button should respect `retryAfter` |
| `otpGlobal` | 500 per hour | Spend ceiling. Raise it as traffic grows |

The Indian-mobile-only validator also blocks international premium numbers, which are the main
pumping target. Consider adding a per-IP limit and a CAPTCHA (Better Auth `captcha` plugin)
before launch.

### Delivery log (`otpDeliveries` table)

One row per channel attempt: phone, channel, `sent` / `failed` / `rate_limited`, provider message
id, error. **The code is never stored.** Use it to debug "I didn't get my OTP" and to compare
channel success rates. `sent` means the provider accepted the message, not that it arrived. Add
provider delivery webhooks to track arrival (see the per-phase notes). The table grows without
bound, so add a cron that deletes rows older than ~30 days before real traffic.

## Configuration

All of these are Convex env vars: `npx convex env set NAME value` (add `--prod` for production).

| Variable | Used by | Purpose |
| --- | --- | --- |
| `OTP_CHANNELS` | dispatcher | Comma-separated order to try. Default `textbee`. E.g. `whatsapp,fast2sms,textbee` |
| `OTP_ALLOW_CONSOLE` | console | `true` enables the log-only channel. **Dev deployments only** |
| `TEXTBEE_API_KEY` | textbee | Required |
| `TEXTBEE_DEVICE_ID` | textbee | Optional, pin a specific phone |
| `TEXTBEE_BASE_URL` | textbee | Optional, for self-hosted textbee |
| `WHATSAPP_ACCESS_TOKEN` | whatsapp | System User permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | whatsapp | Sender's phone number id |
| `WHATSAPP_OTP_TEMPLATE` / `_LANGUAGE` / `WHATSAPP_GRAPH_VERSION` | whatsapp | Default `login_otp` / `en` / `v21.0` |
| `FAST2SMS_API_KEY` | fast2sms | Required |
| `FAST2SMS_ROUTE` | fast2sms | `dlt` (default) or `otp` (no DLT, Fast2SMS-branded text) |
| `FAST2SMS_SENDER_ID` / `FAST2SMS_TEMPLATE_ID` | fast2sms | DLT header and approved template id |

A channel listed in `OTP_CHANNELS` without its env vars is skipped, not treated as an error. If
**no** listed channel is configured, every send fails with a "couldn't send your code" error and
logs `[otp] no channel delivered`.

## Turning it on

1. Pick a channel and set its env vars (see Phase 1 below). For local dev without a phone:
   ```sh
   npx convex env set OTP_CHANNELS console
   npx convex env set OTP_ALLOW_CONSOLE true
   ```
   Codes then show up in `npx convex logs`.
2. Set `phoneOTP: true` in `src/convex/auth.constants.ts`:
   ```ts
   providers: { password: true, phoneOTP: true }
   ```
3. The sign-in UI is `src/lib/auth/ui/PhoneOtpFlow.svelte`. With the flag on, `SignIn.svelte`
   opens on it (phone first, "Continue with email instead" below). Its steps: mobile number →
   6-digit code (30 s resend countdown, "Change number") → full name, shown only for new accounts,
   detected by the placeholder name. The client calls it makes:
   ```ts
   const phoneNumber = normalizeIndianMobile(input);
   await authClient.phoneNumber.sendOtp({ phoneNumber });
   // user types the code
   await authClient.phoneNumber.verify({ phoneNumber, code });
   ```
   `sendOtp` fails with HTTP 429 when rate limited and 500 when no channel could deliver. Show the
   error's `message`.

> **Regenerating the Better Auth schema:** the `phoneNumber` fields in
> `betterAuth/generatedSchema.ts` were added by hand to match what `npx auth generate` produces.
> If you regenerate it, do so with `phoneOTP: true`, or the CLI drops them.

---

## Phase 1: textbee.dev

textbee turns an Android phone into an SMS gateway: our server calls textbee's API, and textbee
pushes the message to the phone, which sends it from its own SIM.

**Setup**
1. Install the textbee app on a spare Android phone with an Indian SIM and an unlimited-SMS plan.
   Grant SMS permission and keep it charging, on Wi-Fi, and exempt from battery optimization.
2. Register at textbee.dev, link the device, create an API key.
3. `npx convex env set TEXTBEE_API_KEY ...` (and optionally `TEXTBEE_DEVICE_ID`).
4. `OTP_CHANNELS=textbee` (the default).

**Limits to know**
- **Delivery depends on one phone.** If it's offline, textbee still accepts the message (we log
  `sent`) and the user gets nothing. The API also returns a `warning` (logged) when the phone last
  reported SMS permission off.
- **Telecom rules.** Indian carriers cap daily SMS on retail plans (often ~100/day) and can block
  SIMs that send bulk near-identical texts. Sending commercial OTPs from a personal SIM sits
  outside TRAI's DLT framework. Fine for a pilot, not for scale. That's what phase 3 is for.
- Rotate across several devices by leaving `TEXTBEE_DEVICE_ID` unset (textbee picks the most
  recently seen device), or extend `textbee.ts` to round-robin device ids.
- Delivery tracking: `GET /api/v1/gateway/devices/{id}/sms-batch/{smsBatchId}`. The batch id is
  stored as `providerMessageId`.

## Phase 2: WhatsApp + Truecaller

Goal: most users never touch SMS. Run `OTP_CHANNELS=whatsapp,textbee` (later
`whatsapp,fast2sms`) so WhatsApp goes first and SMS is the fallback. Offer Truecaller as a
separate one-tap button.

### WhatsApp OTP (`channels/whatsapp.ts`, written, untested)

Uses Meta's WhatsApp Cloud API with an **authentication** template (the category Meta reserves for
OTPs), body `{{1}} is your verification code.` plus a "Copy code" button.

1. Meta Business Manager: create a WhatsApp Business account and register a sender number.
   Complete business verification.
2. Create the authentication template (`login_otp`, `en`, copy-code button) and wait for approval.
3. Create a System User with `whatsapp_business_messaging` and generate a permanent token.
4. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`, then put `whatsapp` first in
   `OTP_CHANNELS`.
5. Test with your own number and check the `otpDeliveries` rows. The payload shape follows Meta's
   docs but hasn't been run against a live account.

Any WhatsApp failure (including "not on WhatsApp", error 131026) falls through to the next
channel. For delivery receipts, subscribe a webhook to `messages` status updates and add an
`httpAction` in `convex/http.ts` that updates `otpDeliveries` by `providerMessageId`.

Later: "one-tap autofill" authentication templates on Android need the app's package name and
signing hash, so they only apply once there's a native app.

### Truecaller (`otp/truecaller.ts`, contract only)

No code is sent. The user taps **Continue with Truecaller**, approves in the Truecaller app, and
Truecaller gives our server a token for a profile with an already-verified phone number.

Planned design (mobile web):
1. Client generates a `requestNonce` and opens the `truecallersdk://` deep link with our partner key.
2. Truecaller POSTs `{ requestId, accessToken, endpoint }` to a new `httpAction` callback.
3. Server **checks that `endpoint` is a Truecaller host**, then fetches the profile with the bearer
   token. Without the host check, a forged callback could make us trust any server.
4. Store the verified result keyed by nonce. The client polls a query for it.
5. A small custom Better Auth plugin endpoint takes the nonce and signs in by phone number,
   reusing the phoneNumber plugin's user lookup so Truecaller and OTP users with the same number
   are the **same account**.

If Truecaller isn't installed or the user declines, fall back to the OTP flow.

Open questions before building: confirm the current web SDK / OAuth contract and profile endpoint
on Truecaller's developer portal (public docs are inconsistent), whether partner approval is
needed for production keys, and which host allowlist to enforce. Native apps would use
Truecaller's OAuth SDK (authorization code + PKCE); only steps 1–2 change.

## Phase 3: Fast2SMS (DLT)

Any business sending SMS to Indian numbers at scale must use **TRAI's DLT** system:

1. Register your business as a **Principal Entity** on a carrier DLT portal (Jio, Airtel, Vi,
   BSNL; one registration works across all). Needs GST/PAN and a letter of authorization.
2. Register a **header** (sender ID), e.g. `MYAPP`.
3. Register an OTP **content template** in the "Service Implicit" category. Its text must match
   what we send exactly, with the code as the variable, e.g.
   `{#var#} is your My App login code. It expires in 5 minutes. Do not share it with anyone.`
   (`renderOtpSms` in `config.ts` is written to be registrable as-is.)
4. Add the header and template to Fast2SMS. Fast2SMS gives each template a message id.
5. Set `FAST2SMS_API_KEY`, `FAST2SMS_SENDER_ID`, `FAST2SMS_TEMPLATE_ID`, and update
   `OTP_CHANNELS`, e.g. `whatsapp,fast2sms,textbee`.

While DLT approval is pending, `FAST2SMS_ROUTE=otp` uses Fast2SMS's pre-approved OTP route
("Your OTP: 123456"). The channel follows the published `bulkV2` API but hasn't been tested live.
Check https://docs.fast2sms.com before going live.

**Alternatives:** MSG91 (has its own OTP widget/API), Gupshup, Kaleyra, Exotel, or Twilio Verify.
They all need the same DLT registration. Adding one is a new file in `channels/` plus a line in
`channels/index.ts`, `types.ts` and the `otpChannelId` validator in `schema.ts`.

## Adding a channel

1. `src/convex/otp/channels/<name>.ts` exporting an `OtpChannel`: `isConfigured()` checks env vars,
   `send({ to, code })` returns `{ ok: true, providerMessageId }` or
   `{ ok: false, error, retryable }`. Don't throw; return failures so the dispatcher can fall back.
2. Add the id to `OtpChannelId` (`types.ts`), `KNOWN_CHANNELS` (`config.ts`), the `otpChannelId`
   validator (`schema.ts`) and `CHANNELS` (`channels/index.ts`).
3. Document its env vars in the table above.

## Next steps

- [x] Sign-in UI: phone step, OTP step with resend countdown, name step for new accounts
- [ ] "Continue with Truecaller" button (phase 2)
- [ ] Profile UI for phone-only users: hide the `@phone.invalid` placeholder, let them add a real email
- [ ] Tests for `sendOtp` fallback and rate limiting with `convex-test` (mock `fetch`)
- [ ] Cron to delete `otpDeliveries` rows older than 30 days
- [ ] Delivery webhooks (textbee batch status, WhatsApp statuses, Fast2SMS DLR)
- [ ] Per-IP rate limit and/or CAPTCHA on `sendOtp`
- [ ] Phase 2 / 3 live testing and the Truecaller implementation
