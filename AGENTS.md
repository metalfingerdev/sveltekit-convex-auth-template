<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`src/convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Project notes

This is a template: SvelteKit 3 + Convex + Better Auth, with Indian phone OTP sign-in and Resend
email verification. See `README.md` and `docs/README.md`.

- Read `src/convex/_generated/ai/guidelines.md` before touching Convex code.
- Check with `pnpm check` and `npx tsc -p src/convex --noEmit`; both must pass.
- Never accept a `userId` argument for authorization; derive the user on the server.
- Secrets live in Convex env vars, never in the repo.
- Deploys: merging to `main` deploys through Vercel (`vercel.json`); CI runs on every PR. See `docs/08-environments-and-deployment.md`.

## Skills

Skills live in `.agents/skills/<name>/`; `.claude/skills/<name>` is a symlink to the same folder.

| Skill | Use it for |
| --- | --- |
| `store-app` | a shop built on this template: catalogue, cart, checkout, orders, admin stock and order board, delivery-partner screens, invoices. Fill in `references/store-profile.md` first |

To add a skill, copy `.agents/skill-template/` to `.agents/skills/<name>/`, add the symlink
(`ln -s ../../.agents/skills/<name> .claude/skills/<name>`) and fill it in. The template folder is
outside `skills/` on purpose so it never loads as a real skill.
