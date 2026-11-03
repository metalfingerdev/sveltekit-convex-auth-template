# 03 – How auth works

## The big picture

```
Browser ──► SvelteKit /api/auth/*  ──proxy──►  Convex HTTP (*.convex.site)
              (routes/api/auth/[...all])         └─ Better Auth (convex/auth.ts)
                                                     └─ tables in the betterAuth component

Browser ◄─ session cookie (same origin as your app)

Browser ──WebSocket + JWT──►  Convex queries/mutations
                               └─ ctx.auth / authComponent.getAuthUser(ctx)
```

- Better Auth runs **inside Convex**. Users, sessions, accounts and orgs are stored in the
  `betterAuth` component's own tables (`src/convex/betterAuth/`), not in your `schema.ts`.
- SvelteKit **proxies** `/api/auth/*` to Convex, so cookies stay first-party on your domain.
- The Convex client sends a JWT minted from the session. `auth.config.ts` makes Convex trust it.

## Route protection (`src/hooks.server.ts`)

Two hooks run in sequence:

1. **`requireAuth`**: every route is **private by default**. Routes in `isPublic([...])` are open.
   Anyone else without a session cookie is redirected to `/signin?redirectTo=…`. Non-page requests
   get a `401` instead.
2. **`setTokenFromCookies`**: puts the Convex token on `event.locals.token`, so server `load`
   functions can query Convex as the user.

**To make a page public**, add it to the list:

```ts
const isPublic = createRouteMatcher([
	'/',
	'/signin',
	// ...
	'/shop{/*rest}' // ← new: /shop and everything under it
]);
```

The pattern syntax is `path-to-regexp` v8. `/pricing`, `/docs`, `/about`, `/terms` and `/privacy`
are already listed as public but don't exist yet.

> This hook check is **optimistic**: it only looks for the cookie. The real security boundary is
> your Convex functions. Every query or mutation that touches private data must check the user
> itself.

## Getting the user in Convex

```ts
import { query } from '../_generated/server';
import { authComponent } from '../auth';

export const whoami = query({
	args: {},
	handler: async (ctx) => {
		// Returns null when signed out
		const user = await authComponent.safeGetAuthUser(ctx);

		// Or throw when signed out
		// const user = await authComponent.getAuthUser(ctx);

		return user; // { _id, name, email, image, role, activeOrganizationId, ... }
	}
});
```

- Use `user._id` (a string) as the owner key on your own tables.
- **Never accept a `userId` argument for authorization.** Always derive the user on the server.
- For Better Auth server APIs (orgs, accounts, API keys), see the pattern in
  `convex/organizations/queries.ts`:

  ```ts
  const auth = createAuth(ctx);
  await auth.api.listOrganizations({ headers: await authComponent.getHeaders(ctx) });
  ```

## Getting the user in Svelte

```svelte
<script lang="ts">
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '#convex/_generated/api.js';

	const auth = useAuth(); // { isLoading, isAuthenticated }
	const user = useQuery(api.users.queries.getActiveUser, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
</script>

{#if auth.isLoading}…{:else if user.data}Hi {user.data.name}{/if}
```

For client-side auth actions (sign out, update user, org calls), use `authClient` from
`#lib/auth/api/auth-client.js`. It's a normal Better Auth client.

## Server-side (SSR) loads

`src/routes/+layout.server.ts` shows how to query Convex during SSR with the user's token:

```ts
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const load = async ({ locals }) => {
	if (!locals.token) return { items: [] };
	const client = createConvexHttpClient({ token: locals.token });
	return { items: await client.query(api.products.queries.listMine, {}) };
};
```

## Triggers

`convex/auth.ts` has `triggers.user.onCreate` / `onDelete` and `triggers.session.onCreate`. Hook
your own setup and cleanup here, for example creating a store record for a new user or deleting
the user's rows when the user is deleted.
