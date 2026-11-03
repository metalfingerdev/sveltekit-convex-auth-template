# 07 – Email verification (Resend)

Users who sign up with an email and password must click a verification link before they can sign
in. Links are sent through [Resend](https://resend.com) using the `@convex-dev/resend` Convex
component, which queues, batches and retries sends and records their delivery status.

## How it works

```
 Browser                          Convex (HTTP action)                          Resend
 ───────                          ────────────────────                          ──────
 authClient.signUp.email() ─────▶ Better Auth creates the user (unverified)
                                  emailVerification.sendVerificationEmail()
                                    └─ email.ts sendEmailVerification()
                                         1. skip `.invalid` placeholder addresses
                                         2. rate limit (per address, global)
                                         3. render template, resend.sendEmail() ──▶ queued → sent
 "Check your email" screen
   [Resend email] ──────────────▶ /send-verification-email (same path as above)

 User clicks the link ──────────▶ /api/auth/verify-email?token=…&callbackURL=…
                                  marks emailVerified, signs in (autoSignInAfterVerification)
                                  redirects to callbackURL

 authClient.signIn.email()        unverified → sends a new link (sendOnSignIn), returns 403
   on 403 → "Check your email"
```

Better Auth generates and checks the token (it's a signed JWT, valid for 1 hour). Our code only
renders and delivers the email.

**Which sign-ins need verification?** Only email + password. Phone OTP users have proved they own
the number, and social sign-ins use the provider's `email_verified` claim. Users created by an
admin (`convex/admin/mutations.ts`) start out verified.

## What changed

| File | Change |
| --- | --- |
| `convex/auth.constants.ts` | `sendEmails: true`. Turns on verification on sign-up, `requireEmailVerification`, the "Check your email" screen and "Forgot password?" |
| `convex/auth.ts` | `emailVerification.sendOnSignIn`: an unverified sign-in attempt sends a fresh link |
| `convex/email.ts` | One `sendAuthEmail` helper for every email: skips `.invalid` placeholder addresses and checks `EMAIL_SEND_FROM`. `sendEmailVerification` is rate limited |
| `convex/model/emails/rateLimits.ts` | New: `verificationPerEmail` and `verificationGlobal` limits |
| `lib/auth/ui/PasswordFlow.svelte` | Sign-in passes `callbackURL`, and a 403 opens the "Check your email" screen instead of only showing a toast |
| `lib/auth/ui/SignIn.svelte` | "Resend email" button with a 30 s cooldown on the "Check your email" screen |

Already in place before this change, and reused: the Resend component mount
(`convex/convex.config.ts`), the `/resend-webhook` route (`convex/http.ts`) and the email templates
(`convex/model/emails/templates/`).

### Phone sign-ups and placeholder emails

Phone-only users get a placeholder email such as `919876543210@phone.invalid`
([06 – Phone sign-in](./06-phone-otp.md#accounts-created-by-phone)). `sendAuthEmail` drops any email
to an `.invalid` address and logs `[email] skipped …`, so turning on `sendEmails` never sends to
these addresses, whatever triggered the email.

### Rate limits

`/send-verification-email` is public, so anyone can call it for any address that has an
unverified account. These limits keep someone's inbox from being flooded and protect the Resend
quota:

| Limit | Default | Notes |
| --- | --- | --- |
| `verificationPerEmail` | 3 per 10 min (token bucket), keyed by lowercased address | Sign-up, unverified sign-in and "Resend email" all count |
| `verificationGlobal` | 200 per hour | Keep it under your Resend plan's quota (the free plan allows 100/day) |

When a limit is hit the request fails with HTTP 429 and the message
`Too many verification emails requested. Try again in N seconds.`, which the UI shows in a toast.
Password reset, magic link and email OTP sends aren't rate limited yet.

## Setup

### 1. Resend account and domain

1. Sign up at resend.com and **add your sending domain** (Domains → Add). Add the DNS records it
   lists (SPF, DKIM, and optionally DMARC) and wait for the domain to show as verified.
   Until then Resend only lets you send from `onboarding@resend.dev`, and only to your own
   account's email. That's fine for a first local test.
2. Create an API key (API Keys → Create, "Sending access" is enough).

### 2. Convex env vars

All are set on the Convex deployment, not in `.env.local`. Add `--prod` for production.

```sh
npx convex env set RESEND_API_KEY re_...
npx convex env set EMAIL_SEND_FROM "My App <no-reply@yourdomain.com>"
npx convex env set BRAND_LOGO_URL https://yourdomain.com/logo.png   # optional
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | ✅ | Read by the Resend component |
| `EMAIL_SEND_FROM` | ✅ | `From:` header. Must be on a verified Resend domain |
| `BRAND_LOGO_URL` | – | Logo at the top of every email |
| `RESEND_WEBHOOK_SECRET` | With the webhook | Verifies webhook signatures |
| `BETTER_AUTH_FALLBACK_URL` | ✅ (already set) | Base for links built without a request |

> **Without `RESEND_API_KEY` and `EMAIL_SEND_FROM`, email sign-up fails.** With `sendEmails: true`,
> Better Auth sends the verification email as part of the sign-up request, so a missing variable
> makes the request fail. Set them before deploying this change.

### 3. Delivery webhook (optional, recommended)

The component tracks each email's status (`queued` → `sent` → `delivered` / `bounced` /
`complained`) when Resend can report back:

1. Resend → Webhooks → Add endpoint:
   `https://<deployment>.convex.site/resend-webhook` (the `.convex.site` URL, not `.convex.cloud`).
2. Select the `email.*` events.
3. Copy the signing secret: `npx convex env set RESEND_WEBHOOK_SECRET whsec_...`

Bounced and complained addresses are then visible in the component's tables in the Convex
dashboard (Data → `resend` component).

### 4. Test it

1. `pnpm dev`, open `/signin`, choose **Continue with email instead**, and sign up with a real
   address. You should land on "Check your email".
2. `npx convex logs` shows the send. In Resend → Emails you can see the message.
3. Click the link. You're signed in and sent back to where you started.
4. Sign out, then sign in again with a second, still-unverified account: you get "Check your
   email" again and a new link.

For automated tests, `new Resend(components.resend, { testMode: true })` only allows Resend's
`@resend.dev` test addresses (`delivered@resend.dev`, `bounced@resend.dev`, …).

## Existing accounts

Password accounts created while `sendEmails` was off have `emailVerified: false`. They now get a
verification link the next time they sign in and can't sign in until they click it. To skip that
for known users, open the Convex dashboard → Data → `betterAuth` component → `user` table and set
`emailVerified` to `true`.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Sign-up fails with `EMAIL_SEND_FROM environment variable is required` | Env var not set on this deployment |
| Resend shows 403 `domain is not verified` | `EMAIL_SEND_FROM` isn't on a verified domain, or you're on `resend.dev` sending to someone else |
| Link opens a page with `?error=…` | Token expired (1 h) or already used. Sign in again to get a new link |
| Link points at the wrong host | The request host isn't in `BETTER_AUTH_ALLOWED_HOSTS`, so Better Auth fell back to `BETTER_AUTH_FALLBACK_URL` |
| Emails stuck in `queued` | `RESEND_API_KEY` missing or invalid. Check `npx convex logs` |

## Next steps

- [ ] Show a message on `/signin` when the link fails (`?error=` in the callback URL)
- [ ] "Send verification email" button next to the "Not verified" badge in the profile
      (`lib/users/ui/Emails.svelte`), hidden for `@phone.invalid` users
- [ ] Rate limit password reset, magic link and email OTP sends the same way
- [ ] `convex-test` tests for the placeholder skip and the rate limit
