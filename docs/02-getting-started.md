# 02 – Getting started

## Prerequisites

- Node 22+ and pnpm
- A Convex account (`npx convex login`)

## 1. Install

```sh
pnpm install
```

## 2. Start Convex

```sh
npx convex dev
```

On the first run it creates or links a dev deployment and writes `.env.local`:

```
CONVEX_DEPLOYMENT=dev:...
PUBLIC_CONVEX_URL=https://<name>.convex.cloud
PUBLIC_CONVEX_SITE_URL=https://<name>.convex.site
```

Keep it running. It watches `src/convex/`, pushes your functions and regenerates
`src/convex/_generated/`.

## 3. Set Convex environment variables

Better Auth runs **inside Convex**, so its secrets go on the Convex deployment, not in
`.env.local`:

```sh
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set BETTER_AUTH_ALLOWED_HOSTS "localhost:5173"
npx convex env set BETTER_AUTH_FALLBACK_URL "http://localhost:5173"
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | ✅ | Signs sessions and tokens |
| `BETTER_AUTH_ALLOWED_HOSTS` | ✅ | Comma-separated hosts the app runs on (wildcards OK, e.g. `*.vercel.app`) |
| `BETTER_AUTH_FALLBACK_URL` | ✅ | Canonical app URL for flows with no request (emails, device flow) |
| `BETTER_AUTH_BASE_URL_PROTOCOL` | – | `http` / `https` / `auto` override |
| `ADMIN_USER_IDS` | – | Comma-separated Better Auth user ids that are always admins |
| `RESEND_API_KEY`, `EMAIL_SEND_FROM` | When `sendEmails: true` (on now) | Email delivery, see [07 – Email verification](./07-email-verification.md#setup) |
| `RESEND_WEBHOOK_SECRET` | With the Resend webhook | Verifies delivery-status webhooks |
| `BRAND_LOGO_URL` | – | Logo shown in emails |
| `REOON_EMAIL_VERIFIER_TOKEN` | When `validateEmails: true` | Rejects disposable or invalid emails at sign-up |
| `<PROVIDER>_CLIENT_ID` / `_SECRET` | Per enabled social provider | OAuth credentials (e.g. `GITHUB_CLIENT_ID`) |
| `OTP_CHANNELS`, `TEXTBEE_API_KEY`, … | When `phoneOTP: true` | Phone OTP delivery, see [06 – Phone sign-in](./06-phone-otp.md#configuration) |

## 4. Run the app

In a second terminal:

```sh
pnpm dev
```

Open http://localhost:5173 and sign up at `/signin`.

## 5. Make yourself admin (optional)

Turn on `admin: true` in `src/convex/auth.constants.ts` first. Then find your user id in the
Convex dashboard under **Data → component `betterAuth` → `user`**. Copy the `_id` and run:

```sh
npx convex env set ADMIN_USER_IDS "<your-user-id>"
```

`/admin` now works for you, and you can promote other users from there.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npx convex dev` | Sync backend + regenerate types (keep running) |
| `pnpm dev` | SvelteKit dev server |
| `pnpm check` | Type-check Svelte + TS |
| `pnpm build` / `pnpm preview` | Production build / preview |
| `npx convex dashboard` | Open the Convex dashboard (data, logs, env) |
| `npx convex env list` | Show deployment env vars |
