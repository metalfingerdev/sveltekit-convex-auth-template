import { page } from '$app/state';
import { resolve } from '$app/paths';
import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
import { gotoApp } from '../primitives/utils/navigation.js';

/**
 * Sends a signed-out visitor to sign in and brings them back to this page afterwards. Call it
 * during component initialization on every private page.
 *
 * hooks.server.ts already does this for a page that is requested from the server, but a page
 * without a server `load` is opened by client-side navigation (pressing "Checkout" in the app),
 * which never asks the server, so the page needs this check too, as `/admin` does. It is UX only:
 * every Convex function behind these pages refuses a signed-out caller.
 */
export function useRequireSignIn() {
	const auth = useAuth();
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated) {
			const back = encodeURIComponent(page.url.pathname + page.url.search);
			void gotoApp(`${resolve('/(auth)/signin')}?redirectTo=${back}`, { replace: true });
		}
	});
	return auth;
}
