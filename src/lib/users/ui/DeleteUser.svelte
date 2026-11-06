<script lang="ts">
	// Primitives
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { toast } from 'svelte-sonner';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { api, authClient } = getAuthContext();
	const client = useConvexClient();

	// Utils
	import { refreshAll } from '$app/navigation';

	// State
	let deleteDialogOpen: boolean = $state(false);
	let isDeleting: boolean = $state(false);

	/**
	 * Handle the delete confirmation action
	 */
	async function handleConfirm(): Promise<void> {
		isDeleting = true;

		// Step 1: Delete user via Convex to have transaction safety
		try {
			await client.mutation(api.users.mutations.deleteUser, {});
		} catch (error) {
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Failed to delete user');
			}
			isDeleting = false;
			return;
		}

		// Step 2: Sign out via Better Auth
		const { error: signOutError } = await authClient.signOut();
		if (signOutError) {
			toast.error(signOutError.message || `${signOutError.status} ${signOutError.statusText}`);
			isDeleting = false;
			return;
		}

		toast.success('Account deleted');
		isDeleting = false;
		// Runs the server hooks again, which send a signed-out visitor away from this page
		refreshAll();
	}
</script>

<Button onclick={() => (deleteDialogOpen = true)} disabled={isDeleting} aria-busy={isDeleting}>
	Delete account
</Button>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete your account"
	description="Are you sure you want to delete your account? All of your data will be permanently deleted."
	confirmLabel="Delete"
	cancelLabel="Cancel"
	onconfirm={handleConfirm}
/>
