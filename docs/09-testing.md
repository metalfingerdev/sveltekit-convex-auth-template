# 09 – Testing

Two layers, each for what it does best. Every test must be able to fail when the behaviour it
guards breaks. Don't add tests that restate a table, a string or static data, and don't test the
same thing at both layers.

| Layer | Command | Runs in CI | What belongs here |
| --- | --- | --- | --- |
| Vitest (`*.test.ts` next to the code) | `pnpm test` | yes | Convex functions through `convex-test` (refusals: signed out, another user's data, admin-only; money; idempotency; what public queries may expose) and pure logic with real edge cases (phone numbers, the OTP dispatcher). |
| Playwright (`tests/e2e/*.spec.ts`) | `pnpm test:e2e` | no | Real pages on a phone-sized Chromium against the **dev** deployment: which pages open for whom, and the main user paths. |

## Vitest

- Files that must not be deployed or run as tests carry two dots (`vitest.setup.ts`,
  `harness.testutils.ts`): Convex ignores such names, and Vitest only runs `*.test.ts`.
- `convex-test` doesn't mount the Better Auth component that the real access guards read. When you
  add guarded functions, replace the guards for every test in a `src/convex/vitest.setup.ts`
  (listed under `setupFiles` in `vitest.config.ts`) with stand-ins that read
  `ctx.auth.getUserIdentity()`: refuse a signed-out caller and take the user id from the identity.
  Cover the real guards in Playwright.
- Examples to copy: `src/convex/otp/phone.test.ts` (pure logic) and `src/convex/otp/send.test.ts`
  (a dispatcher with its channels mocked).

## Playwright

The suite creates accounts and changes data, so it only runs against a dev deployment.
`playwright.config.ts` refuses to start unless `CONVEX_DEPLOYMENT` is a `dev:` deployment and
`PUBLIC_CONVEX_URL` points at the same one.

### One-time setup

1. The dev deployment needs the console OTP channel (never on staging or production):
   `npx convex env set OTP_CHANNELS console` and `npx convex env set OTP_ALLOW_CONSOLE true`.
2. Add test accounts to `.env.local` (gitignored). Use numbers that belong to test accounts on the
   dev deployment, never a real person's:

   ```sh
   E2E_USER_PHONE=+91XXXXXXXXXX
   E2E_ADMIN_PHONE=+91XXXXXXXXXX
   ```

   The admin spec runs only when `admin: true` in `src/convex/auth.constants.ts`, and the admin
   account must be an admin on dev (`ADMIN_USER_IDS`, see [02](./02-getting-started.md)).
3. `pnpm exec playwright install chromium` fetches the matching Chromium if it isn't cached.

### Running

```sh
pnpm test:e2e                          # starts pnpm dev on :5173 unless it is already running
pnpm test:e2e tests/e2e/access.spec.ts # one file
```

The `setup` project signs each account in once with phone OTP. The code is read from
`npx convex logs`, since the console channel prints it there. The session is kept in
`tests/e2e/.auth/<role>.json` and reused while it is valid. Specs without the account they need are
skipped and say why.
