# 05 – Configuration

## Feature flags: `src/convex/auth.constants.ts`

Both the backend (`convex/auth.ts`) and the frontend (`auth-client.ts`, layout and components)
read this one object. It currently contains:

```ts
export const AUTH_CONSTANTS: AuthConstants = {
	providers: { password: true, phoneOTP: true },
	sendEmails: true,
	brandName: 'My App'
};
```

A fuller example:

```ts
export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		password: true,
		google: true,
		github: true,
		emailOTP: true,
		magicLink: true
	},
	sendEmails: true, // required for emailOTP, magicLink and organizations
	validateEmails: false, // Reoon email check at sign-up
	organizations: true,
	admin: true,
	apiKeys: false,
	deviceAuthorization: false,
	brandName: 'My App',
	brandTagline: '…',
	terms: 'https://…/terms',
	privacy: 'https://…/privacy'
};
```

The `AuthConstants` type enforces that `emailOTP`, `magicLink` and `organizations` need
`sendEmails: true`.

## Adding a social provider

1. Set `providers.<name>: true` in `auth.constants.ts`.
2. Create an OAuth app with the provider. Set the callback URL to
   `https://<your-app-host>/api/auth/callback/<provider>`
   (locally: `http://localhost:5173/api/auth/callback/google`).
3. Set the credentials on Convex:
   ```sh
   npx convex env set GOOGLE_CLIENT_ID ...
   npx convex env set GOOGLE_CLIENT_SECRET ...
   ```

Supported providers are listed in `convex/auth.constants.types.ts`. X uses the env prefix `X_`, and
TikTok uses `TIKTOK_CLIENT_KEY`.

## Email (Resend)

1. Set `sendEmails: true`.
2. Set `RESEND_API_KEY` and `EMAIL_SEND_FROM` (e.g. `My App <no-reply@yourdomain.com>`), and
   optionally `BRAND_LOGO_URL`, on Convex.
3. Optional: point a Resend webhook at `https://<deployment>.convex.site/resend-webhook` to track
   delivery status.

Templates live in `src/convex/model/emails/templates/`. The brand name in emails comes from
`brandName`.

`sendEmails: true` also makes email + password accounts verify their address before they can sign
in. The full flow, rate limits and troubleshooting are in
[07 – Email verification](./07-email-verification.md).

## Phone sign-in (OTP)

Set `providers.phoneOTP: true` and configure a delivery channel. Everything is in
[06 – Phone sign-in](./06-phone-otp.md).

## Better Auth plugins

Plugins and options are in `createAuthOptions` in `src/convex/auth.ts`. If you add a Better Auth
plugin that adds tables or fields, also:

- add the matching client plugin in `src/lib/auth/api/auth-client.ts`, and
- regenerate the component schema (`src/convex/betterAuth/generatedSchema.ts`) with the Better
  Auth CLI, following the
  [local install guide](https://labs.convex.dev/better-auth/features/local-install). Put custom
  indexes in `betterAuth/schema.ts` so they survive regeneration.

## Production deployment

1. **Convex**: `npx convex deploy` (or set `CONVEX_DEPLOY_KEY` in CI). Set all the env vars from
   [02 – Getting started](./02-getting-started.md) on the **prod** deployment, with your real
   domain:
   ```sh
   npx convex env set --prod BETTER_AUTH_ALLOWED_HOSTS "example.com,www.example.com"
   npx convex env set --prod BETTER_AUTH_FALLBACK_URL "https://example.com"
   ```
2. **SvelteKit**: the project uses `adapter-auto`, which works on Vercel, Netlify, Cloudflare and
   similar hosts. Set `PUBLIC_CONVEX_URL` and `PUBLIC_CONVEX_SITE_URL` to the prod deployment's
   URLs. On Vercel or Netlify the build command can be
   `npx convex deploy --cmd 'pnpm build'`, which injects the URL.
3. **OAuth apps**: add the production callback URLs.
4. For preview deployments, add their host pattern (e.g. `*.vercel.app`) to
   `BETTER_AUTH_ALLOWED_HOSTS`.

## Security notes

- The `/admin` page check is only for UX. Every function in `convex/admin/*` enforces admin
  rights on the server, and new admin functions must do the same (see `model/admin/`).
- Better Auth's HTTP `/admin/*` endpoints are blocked except impersonation. Admin actions go
  through Convex functions.
- Every query or mutation that returns or changes private data must derive the user with
  `authComponent` and check ownership.
