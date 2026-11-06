# Roles and access

Three roles, one rule: every store function calls exactly one guard from
`src/convex/model/store/access.ts`. The UI hides things for convenience; the guard is the boundary
(`/admin` already says this in its comments).

| Role | How someone becomes one | Guard |
| --- | --- | --- |
| Public | nothing | none (the function must return only public fields) |
| Customer | any signed-in user | `requireCustomer(ctx)` |
| Admin | Better Auth `admin` role, or listed in `ADMIN_USER_IDS` (first admin) | `requireAppAdmin(ctx)`, existing in `src/convex/model/admin/index.ts` |
| Delivery partner | an admin adds their phone number in `/admin/delivery` | `requireDeliveryPartner(ctx)` |

An admin may also order as a customer. Delivery partners are ordinary users who also have a
`deliveryPartners` row.

## Why partners are matched by phone number

Sign-in is phone-first, and the phone plugin verifies the number. So the admin types the partner's
mobile number, the partner signs in with an OTP, and the app recognises them. No invite flow, no
second account, no custom Better Auth roles to maintain.

The guard must check that the number is **verified**; otherwise a user could attach someone else's
number to their own account and see that partner's orders.

```ts
// src/convex/model/store/access.ts
import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../../_generated/server';
import { authComponent } from '../../auth';

export { requireAppAdmin } from '../admin';

/** Any signed-in user. `getAuthUser` throws when signed out. */
export const requireCustomer = async (ctx: QueryCtx | MutationCtx) => {
	return await authComponent.getAuthUser(ctx);
};

export const requireDeliveryPartner = async (ctx: QueryCtx | MutationCtx) => {
	const user = await authComponent.getAuthUser(ctx);
	const { phoneNumber, phoneNumberVerified } = user as {
		phoneNumber?: string | null;
		phoneNumberVerified?: boolean | null;
	};
	if (!phoneNumber || !phoneNumberVerified) throw new ConvexError('Not a delivery partner');
	const partner = await ctx.db
		.query('deliveryPartners')
		.withIndex('by_phoneNumber', (q) => q.eq('phoneNumber', phoneNumber))
		.unique();
	if (!partner || !partner.isActive) throw new ConvexError('Not a delivery partner');
	return { user, partner };
};
```

Check the fields on the real user document (`src/convex/betterAuth/generatedSchema.ts`) before
relying on the names above. Use one error message for every refusal so the response doesn't reveal
who is a partner.

## What each role may see

| Data | Customer | Admin | Partner |
| --- | --- | --- | --- |
| Products, categories | active ones, public fields | all, with stock and cost-free fields | read-only, active |
| Cart, addresses | own | no need | no |
| Orders | own | all | only those assigned to them |
| Customer phone and address | own | yes | for assigned orders **until delivered**; afterwards the phone is masked to the last 4 digits |
| Delivery code | own order | yes | **never**: the customer reads it out, the partner types it |
| Stock adjustments, settings (write) | no | yes | no |
| Cash totals | no | all partners | own |

Partner queries return a purpose-built projection (name, phone, address, items, amount to collect),
not the order document. A projection can't leak a field that is added to the table later.

## `myRoles`: for the header and the home page

One public-safe query tells the UI which links to show:

```ts
export const myRoles = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return { isAdmin: false, isPartner: false };
		// admin check and partner lookup, each returning false instead of throwing
	}
});
```

Show "Admin" and "Delivery" entries in the user menu from it. This is UX only; the routes and
functions enforce access themselves.

## Route gating

All routes are private by default (`src/hooks.server.ts`). Customer browsing routes are the only
ones to add to `isPublic`. `/admin/*` and `/delivery/*` stay private, and each layout shows a
neutral spinner while `myRoles` resolves, then "Access denied" for the wrong role, as
`src/routes/admin/+page.svelte` does.

**A private page also needs its own client-side redirect.** `hooks.server.ts` only runs when the
server is asked for the page, so a page without a server `load` is opened by client-side navigation
(pressing "Checkout" in the app) without ever reaching it, and a signed-out visitor would see a
broken page. Call `useRequireSignIn()` (`src/lib/auth/requireSignIn.svelte.ts`) in every private
page; it sends them to `/signin` and back. It is UX only: the Convex functions still refuse a
signed-out caller.

A delivery partner's phone is shown to the customer only while the order is `out_for_delivery`.

## Tests worth having

For each guarded function: signed-out is refused, a customer is refused on admin functions, a
partner can't open another partner's order, and an unverified phone number doesn't make a partner.
In Vitest the guards are stand-ins (`src/convex/vitest.setup.ts`, extend it for a new guard); the
pages and the real guards are checked by the Playwright suite (`tests/e2e`, `docs/09-testing.md`).
