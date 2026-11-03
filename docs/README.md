# Developer docs

This app is built on a SvelteKit + Convex + Better Auth starter. The auth, user and organization
code came from the `@auth/svelte` jsrepo registry (see `jsrepo.config.ts`).

| Doc | What it covers |
| --- | --- |
| [01 – Overview](./01-overview.md) | What the template contains and where it lives |
| [02 – Getting started](./02-getting-started.md) | Local setup, env vars, running the app, first admin |
| [03 – How auth works](./03-auth.md) | Request flow, route protection, reading the user in Convex and Svelte |
| [04 – Building features](./04-building-features.md) | Adding tables, functions and pages: a worked example |
| [05 – Configuration](./05-configuration.md) | Feature flags, sign-in providers, email, branding, deployment |
| [06 – Phone sign-in](./06-phone-otp.md) | Phone OTP architecture and the textbee → WhatsApp/Truecaller → Fast2SMS rollout |
| [07 – Email verification](./07-email-verification.md) | Resend setup, the verification flow, rate limits, troubleshooting |
| [08 – Environments and deployment](./08-environments-and-deployment.md) | Local / staging / production, the Vercel + Convex pipeline, CI, moving to production |

## Stack

- **SvelteKit 3** with Svelte 5 (runes) and TypeScript
- **Convex**: database, server functions, file storage, realtime (`convex-svelte`)
- **Better Auth**, running inside Convex via `@convex-dev/better-auth`
- **Tailwind CSS 4** + **Skeleton UI 5**, plus Ark UI / svelte-toolbelt primitives
- **Resend** (Convex component) for transactional email
- **Phone OTP** via Better Auth's `phoneNumber` plugin, delivered by textbee / WhatsApp / Fast2SMS (`src/convex/otp/`)
- **pnpm** as the package manager
