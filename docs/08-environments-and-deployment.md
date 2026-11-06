# 08 – Environments and deployment

This template deploys to Vercel with the backend on Convex. The recommended pattern is two
stages: a **staging** site you deploy from `main` while building, and a **production** site you
launch later on a real domain (often from a different repo or organization, with its own Vercel and
Convex projects). Nothing in the repo hard-codes a repo name, a Vercel project or a Convex
deployment, so the same `vercel.json` and CI workflow work in either place.

| Env | Frontend | Convex backend | Deployed by |
| --- | --- | --- | --- |
| Local dev | `localhost:5173` | the dev deployment (`npx convex dev`) | each developer |
| Staging | `<project>.vercel.app`, from `main` | this Convex project's **production** slot, used as staging | Vercel, on push to `main` |
| Production (later) | your domain | a new Convex project | set up at launch |

Staging uses the Convex "production" slot so it stays separate from the dev deployment, which
`npx convex dev` overwrites constantly. Real production gets its own Convex project, so staging
test data never mixes with real customers. The staging site shows a **Staging** badge in the
header (`PUBLIC_APP_ENV=staging`), so nobody mistakes it for the real site.

## How a deploy works

```
 PR opened ──▶ GitHub Actions (.github/workflows/ci.yml)
               pnpm check · tsc on src/convex · pnpm test · pnpm build   ← must be green to merge

 merge to main ──▶ Vercel build (vercel.json)
                   npx convex deploy --cmd 'pnpm build'
                     1. pushes src/convex to the Convex deployment named by CONVEX_DEPLOY_KEY
                     2. runs the build with PUBLIC_CONVEX_URL set to that deployment
                   adapter-vercel (region bom1, Mumbai) serves the site
```

Convex and the site deploy together, so the site never runs against functions it doesn't match.
Branches other than `main` are skipped (`ignoreCommand`), so there's one staging site and no
per-PR previews. Add previews later with a Convex preview deploy key.

Contributors work on branches and open PRs. CI has no secrets; it only proves the code type-checks
and builds.

## One-time setup (staging)

1. **GitHub**: create the repo, push `main`, then Settings → Branches → protect `main` and require
   the **CI** check.
2. **Convex deploy key**: Convex dashboard → this project's **Production** deployment →
   Settings → Deploy keys → generate one.
3. **Convex env vars** on that deployment (`npx convex env set --prod NAME value`):

   | Variable | Value |
   | --- | --- |
   | `BETTER_AUTH_SECRET` | a new secret (`openssl rand -base64 32`), not the dev one |
   | `BETTER_AUTH_ALLOWED_HOSTS` | `<project>.vercel.app` |
   | `BETTER_AUTH_FALLBACK_URL` | `https://<project>.vercel.app` |
   | `RESEND_API_KEY`, `EMAIL_SEND_FROM` | see [07 – Email verification](./07-email-verification.md) |
   | `OTP_CHANNELS`, `TEXTBEE_API_KEY` | see [06 – Phone sign-in](./06-phone-otp.md). Use `textbee` once anyone besides you tests |
   | `ADMIN_USER_IDS` | your user id (after your first sign-in on staging) |

   `OTP_ALLOW_CONSOLE` is acceptable on staging only while you're the sole tester, since codes go to
   logs only you can read. Never set it on real production.
4. **Vercel**: Add New → Project → import the repo. Framework preset SvelteKit. Environment
   variables (Vercel's "Production" scope, which is staging here):

   | Variable | Value |
   | --- | --- |
   | `CONVEX_DEPLOY_KEY` | the key from step 2 |
   | `PUBLIC_CONVEX_SITE_URL` | `https://<name>.convex.site` of the production deployment |
   | `PUBLIC_APP_ENV` | `staging` |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (so Vercel uses the pnpm version in `package.json`) |

   `PUBLIC_CONVEX_URL` is set by `convex deploy` during the build; don't add it.
5. Deploy. Sign up on the `.vercel.app` URL and check the Staging badge appears.

## Rollback

- **Site**: Vercel → Deployments → pick the last good one → Promote to Production.
- **Convex functions**: they deploy with each build, so revert the commit on `main` (or redeploy
  the previous Vercel deployment's commit). Schema changes can't be rolled back by code alone,
  so keep them backward compatible.

## Moving to production

Do this when the domain is bought and you are ready to launch.

- [ ] Move the code: transfer the repo to the organization that will own it, or push it to a new one
- [ ] New Vercel project under the owning account, with the same `vercel.json`
- [ ] New Convex project in the owning team (not the staging one); generate its production deploy key
- [ ] Domain bought and DNS pointed at Vercel; add it to the Vercel project
- [ ] Convex env vars on the new production deployment: fresh `BETTER_AUTH_SECRET`;
      `BETTER_AUTH_ALLOWED_HOSTS` and `BETTER_AUTH_FALLBACK_URL` for the domain; `ADMIN_USER_IDS`
- [ ] Email: verify the domain in Resend, then set `EMAIL_SEND_FROM` to an address on it
      (the `resend.dev` test sender can't email real users)
- [ ] Phone OTP: a real channel, textbee at minimum, then Fast2SMS with DLT registration for scale
      ([06](./06-phone-otp.md)). No `OTP_ALLOW_CONSOLE`
- [ ] Vercel env vars: `CONVEX_DEPLOY_KEY`, `PUBLIC_CONVEX_SITE_URL`, `ENABLE_EXPERIMENTAL_COREPACK`;
      **do not** set `PUBLIC_APP_ENV`, so the badge is off
- [ ] Branch protection and the required CI check on the new repo
- [ ] Resend webhook pointed at the new `.convex.site/resend-webhook`
- [ ] Sign up and test every sign-in method on the real domain before announcing
