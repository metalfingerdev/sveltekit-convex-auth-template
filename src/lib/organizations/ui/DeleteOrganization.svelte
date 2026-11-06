<script lang="ts">
	// Svelte
	import { tick } from 'svelte';

	// API
	import { gotoApp } from '../../primitives/utils/navigation.js';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useRoles } from '../api/roles.svelte.js';
	import { getAuthContext } from '../../auth/context.svelte.js';
	import { safeRedirect } from '../../auth/utils/safeRedirect.js';
	const { api } = getAuthContext();
	const client = useConvexClient();

	/** UI **/
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Dialog from '../../primitives/ui/dialog/index.js';
	// Icons
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	// Types
	import type { GetActiveOrganizationType, Role } from '../../auth/types.js';

	/**
	 * Component for deleting an organization
	 * Only available to organization owners
	 */
	const { onSuccessfulDelete, redirectTo, initialData }: {
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: () => void;
		/**
		 * Optional redirect URL after successful deletion
		 */
		redirectTo?: string;
		initialData?: {
			activeOrganization?: GetActiveOrganizationType;
			role?: Role;
		};
	} = $props();

	// Auth
	const auth = useAuth();

	// Queries
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeOrganization
		})
	);
	const activeOrganization = $derived(activeOrganizationResponse?.data);
	const roles = useRoles({}, () => ({
		initialData: initialData?.role
	}));
	const isOwner = $derived(roles.hasOwnerRole);

	// State
	let dialogOpen: boolean = $state(false);
	let isDeleting: boolean = $state(false);

	/**
	 * Handle confirmation of organization deletion
	 */
	async function handleConfirm(): Promise<void> {
		isDeleting = true;
		try {
			if (!activeOrganization) return;

			await client.mutation(api.organizations.mutations.deleteOrganization, {
				organizationId: activeOrganization.id
			});

			dialogOpen = false;
			// Let the confirm dialog close in its own flush before closing the parent
			// dialog and navigating: tearing both Zag dialog machines down in the same
			// flush as the post-delete query churn crashes Svelte's batch scheduler
			// ("Cannot read properties of null (reading 'schedule')") and leaves the
			// organization profile dialog frozen open.
			await tick();
			toast.success('Organization deleted successfully');

			// Call the onSuccessfulDelete callback if provided
			if (onSuccessfulDelete) {
				onSuccessfulDelete();
			}
			await tick();

			// Navigate to the specified URL if it is on this site, else home
			const target = safeRedirect(redirectTo);
			void gotoApp(target);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('Unknown error. Please try again. If it persists, contact support.');
			}
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if isOwner && activeOrganization}
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger
			class="button button-sm tone-raised text-text-muted hover:bg-danger-tint hover:text-text w-fit justify-between gap-1 text-sm"
			>Delete organization</Dialog.Trigger
		>

		<Dialog.Content class="w-[90%] max-w-md">
			<Dialog.Header>
				<Dialog.Title>Delete organization</Dialog.Title>
			</Dialog.Header>

			<article>
				<div class="text-text-muted space-y-3 text-sm">
					<p>Are you sure you want to delete this organization?</p>
					<div
						class="bg-background border-background rounded-xl border p-3 text-center"
					>
						<span class="text-text font-semibold">{activeOrganization.name}</span>
					</div>
					<p>All organization data will be permanently deleted and cannot be recovered.</p>
				</div>
			</article>

			<Dialog.Footer class="w-full">
				<Dialog.Close class="button tone-raised" disabled={isDeleting}>Cancel</Dialog.Close>
				<button
					type="button"
					class="button tone-danger"
					onclick={handleConfirm}
					disabled={isDeleting}
					aria-busy={isDeleting}
				>
					{#if isDeleting}
						<Loader2Icon class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
						Deleting...
					{:else}
						Delete
					{/if}
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
