# 04 – Building features

Start here when adding app functionality. Before writing Convex code, read
`src/convex/_generated/ai/guidelines.md`. It has the current API rules.

## The workflow

1. **Schema**: add tables to `src/convex/schema.ts`.
2. **Functions**: add queries and mutations under `src/convex/<feature>/`.
3. **UI**: add components under `src/lib/<feature>/` and pages under `src/routes/`.
4. **Protect**: check the user in every function. Add the route to `isPublic` only if it's meant
   to be public.

`npx convex dev` must be running so the `api.*` types regenerate as you go.

## Worked example: a "products" feature

### 1. Schema (`src/convex/schema.ts`)

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	products: defineTable({
		ownerId: v.string(), // Better Auth user._id
		organizationId: v.optional(v.string()), // if scoping to orgs
		name: v.string(),
		priceCents: v.number(),
		imageId: v.optional(v.id('_storage'))
	})
		.index('by_ownerId', ['ownerId'])
		.index('by_organizationId', ['organizationId'])
});
```

### 2. Functions (`src/convex/products/queries.ts`, `mutations.ts`)

```ts
// queries.ts
import { query } from '../_generated/server';
import { authComponent } from '../auth';

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return [];
		return await ctx.db
			.query('products')
			.withIndex('by_ownerId', (q) => q.eq('ownerId', user._id))
			.order('desc')
			.take(100);
	}
});
```

```ts
// mutations.ts
import { mutation } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { authComponent } from '../auth';

export const create = mutation({
	args: { name: v.string(), priceCents: v.number() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx); // throws if signed out
		return await ctx.db.insert('products', { ...args, ownerId: user._id });
	}
});

export const remove = mutation({
	args: { id: v.id('products') },
	handler: async (ctx, { id }) => {
		const user = await authComponent.getAuthUser(ctx);
		const product = await ctx.db.get('products', id);
		if (!product || product.ownerId !== user._id) throw new ConvexError('Not found');
		await ctx.db.delete('products', id);
	}
});
```

These become `api.products.queries.listMine`, `api.products.mutations.create`, and so on.

### 3. Page (`src/routes/products/+page.svelte`)

```svelte
<script lang="ts">
	import { useQuery, useMutation } from 'convex-svelte';
	import { api } from '#convex/_generated/api.js';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';

	const products = useQuery(api.products.queries.listMine, {});
	const create = useMutation(api.products.mutations.create);

	let name = $state('');
	let price = $state(0);

	async function add(e: SubmitEvent) {
		e.preventDefault();
		await create({ name, priceCents: Math.round(price * 100) });
		name = '';
	}
</script>

<form onsubmit={add} class="flex items-end gap-2 p-4">
	<Field label="Name"><input bind:value={name} required /></Field>
	<Field label="Price"><input type="number" step="0.01" bind:value={price} /></Field>
	<Button type="submit" variant="primary">Add</Button>
</form>

{#if products.isLoading}Loading…{:else}
	<ul class="p-4">
		{#each products.data ?? [] as p (p._id)}
			<li>{p.name}: {(p.priceCents / 100).toFixed(2)}</li>
		{/each}
	</ul>
{/if}
```

`useQuery` is **live**: when another tab adds a product, this list updates on its own.

The route is private by default, so signed-out visitors are sent to `/signin`.

## Scoping to organizations

If you turn on `organizations: true`, the active org is on the user (`user.activeOrganizationId`).
Store it on your rows and filter by it. To check membership or role, reuse the pattern in
`convex/organizations/queries.ts`, `getOrganizationRole`.

## File uploads

`api.storage.generateUploadUrl` already exists and requires a signed-in user. POST the file to
the returned URL, then save the resulting `storageId` with a mutation. Serve it with
`ctx.storage.getUrl(id)`. `src/lib/primitives/ui/image-cropper` and
`src/lib/primitives/utils/optimizeImage.ts` are reusable for product images.

## Reusable UI

Build screens from `src/lib/ui`: Button, Card, Pill, Field, Choice, Notice, Select, Switch, Sheet,
Modal, ConfirmDialog and Spinner. `src/lib/primitives/ui/` holds the Bits UI wrappers: avatar,
copy-button, dialog, drawer, image-cropper, menu, password, popover, select, sonner (toasts:
`import { toast } from 'svelte-sonner'`) and tabs.

Colours come only from `src/themes/palette.css` (change the values there to rebrand). Put a
component's styling in its `<style lang="postcss">` block with `@reference 'src/app.css';` and
`@apply`, not in long inline class lists. `src/themes/compat.css` keeps the old Skeleton class names
(`btn`, `preset-*`, `surface-*`) alive for the account, user and organization screens; don't use
them in new code.

Private pages that are opened by client-side navigation should call `useRequireSignIn()`
(`src/lib/auth/requireSignIn.svelte.ts`), as `/account` does.

## Common tasks

| Task | Where |
| --- | --- |
| Change the home page | `src/routes/+page.svelte` |
| Change the header / app name ("Svelte") | `src/routes/+layout.svelte` |
| Background job on a schedule | `src/convex/crons.ts` (`cronJobs()`) |
| Webhook endpoint | `src/convex/http.ts` (`http.route(...)`) |
| Call a third-party API | an `action` in Convex (use `"use node"` only if you need Node built-ins) |
| Change data shape on a live deployment | `src/convex/migrations.ts` (`@convex-dev/migrations`) |
| Tests | `*.test.ts` next to the code (Vitest, `convex-test`), pages in `tests/e2e`: [09](./09-testing.md) |

## Tips

- Bound your reads: `.take(n)` or `.paginate()`, not `.collect()` on tables that grow.
- Query through indexes (`.withIndex`), not `.filter`.
- Keep `pnpm check` clean. Convex types catch most mistakes before deploy.
