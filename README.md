# SvelteKit + Convex + Better Auth template

A full-stack starter on current versions, with sign-in built for Indian users:

- **SvelteKit 3** + Svelte 5 (runes), Tailwind CSS 4, Skeleton UI 5
- **Convex** backend with **Better Auth** running inside it (`@convex-dev/better-auth` 0.12, Better Auth 1.6)
- **Phone OTP sign-in** for Indian mobiles (`+91`), delivered by textbee (SMS from an Android phone), WhatsApp or Fast2SMS (DLT), with fallback between channels, rate limits and a delivery log
- **Email verification** through Resend, with resend button, rate limits and placeholder-email protection for phone-only accounts
- Email + password, social providers, organizations, admin dashboard and API keys, each behind a flag in `src/convex/auth.constants.ts`

## Quick start

```sh
pnpm install
npx convex dev          # first run creates a dev deployment and writes .env.local; keep it running
```

In another terminal, set the Convex env vars:

```sh
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set BETTER_AUTH_ALLOWED_HOSTS "localhost:5173"
npx convex env set BETTER_AUTH_FALLBACK_URL "http://localhost:5173"

# Phone OTP without a real SMS channel: codes are printed to `npx convex logs`
npx convex env set OTP_CHANNELS console
npx convex env set OTP_ALLOW_CONSOLE true

# Email verification (Resend). Without a verified domain, Resend only delivers to your own address
npx convex env set RESEND_API_KEY re_...
npx convex env set EMAIL_SEND_FROM "My App <onboarding@resend.dev>"
```

Then `pnpm dev` and open http://localhost:5173/signin.

Rename the app by changing `brandName` in `src/convex/auth.constants.ts` and `name` in
`package.json`.

## Docs

Start at [docs/README.md](./docs/README.md):

| Doc | What it covers |
| --- | --- |
| [02 – Getting started](./docs/02-getting-started.md) | Setup, env vars, first admin |
| [05 – Configuration](./docs/05-configuration.md) | Feature flags, providers, deployment |
| [06 – Phone sign-in](./docs/06-phone-otp.md) | OTP channels, DLT, WhatsApp, Truecaller plan |
| [07 – Email verification](./docs/07-email-verification.md) | Resend setup and the verification flow |

`MIGRATION_TASKS.md` lists SvelteKit 3 migration items still to review.
