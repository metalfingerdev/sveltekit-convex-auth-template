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

## Commands

| Command | What it does |
| --- | --- |
| `pnpm check` | type-check Svelte + TS (must be 0 errors) |
| `npx tsc -p src/convex --noEmit` | type-check the Convex functions |
| `pnpm test` | Vitest (`*.test.ts` next to the code) |
| `pnpm test:e2e` | Playwright in `tests/e2e` against the **dev** deployment (not in CI; `docs/09-testing.md`) |

Convex ignores file names with more than one dot, so `foo.test.ts` is never deployed. **Only real
tests**: each must be able to fail when the behaviour it guards breaks; no tests that restate a
table, a string or static data, and nothing tested twice across Vitest and Playwright.

## Conventions

- **Formatting is 2 spaces and double quotes** (`.prettierrc`). Older files still use tabs and
  single quotes; keep a file's existing style for small edits and never reformat files you aren't
  changing. New and rewritten files use the `.prettierrc` style.
- **The UI uses our own palette and Bits UI.** Colours come from `src/themes/palette.css` only:
  layers `background` (darkest) < `midground` < `foreground` (lightest), plus `text`, `text-muted`,
  `primary`, `secondary`, `on-secondary`, `danger`, `warning`, `success`, `info`, `border`. Never
  reorder the layers. Light only: there is no dark mode. Build screens from `src/lib/ui` and the
  Bits wrappers in `src/lib/primitives/ui`. Borders and hard shadows are never black: use the
  `edge`, `edge-flat` and `edge-press` utilities in `src/app.css` and set `--fill` to the element's
  own background.
- **`src/themes/compat.css` implements Skeleton's old class and colour names** (`btn`,
  `preset-tonal`, `input`, `surface-600-400`, `h3`, ...) so the account, user and organization
  screens keep working. Never use those names in new code; when you touch one of those files, move
  it to `src/lib/ui` components and drop the names nothing uses.
- **No long Tailwind class lists inline.** Give the element a short semantic class and put the
  Tailwind in the component's style block: `<style lang="postcss">`, `@reference 'src/app.css';`,
  then rules with `@apply`. One or two layout utilities in markup are fine.
- **Routes are private by default.** Add a route to `isPublic` in `src/hooks.server.ts` only if it
  is meant for signed-out visitors. A private page opened by client-side navigation also calls
  `useRequireSignIn()` (`src/lib/auth/requireSignIn.svelte.ts`). Route checks are UX; the Convex
  function check is security.

## Skills

Skills live in `.agents/skills/<name>/`; `.claude/skills/<name>` is a symlink to the same folder.

| Skill | Use it for |
| --- | --- |
| `store-app` | a shop built on this template: catalogue, cart, checkout, orders, admin stock and order board, delivery-partner screens, invoices. Fill in `references/store-profile.md` first |

To add a skill, copy `.agents/skill-template/` to `.agents/skills/<name>/`, add the symlink
(`ln -s ../../.agents/skills/<name> .claude/skills/<name>`) and fill it in. The template folder is
outside `skills/` on purpose so it never loads as a real skill.
