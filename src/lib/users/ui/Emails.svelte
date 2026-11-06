<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	// API
	import { useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { api, authClient } = getAuthContext();

	// Icons
	import Pill from '#lib/ui/Pill.svelte';
	import ProfileField from './ProfileField.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	// Primitives
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';

	// Constants
	
	// Types
	import type { GetActiveUserType } from '../../auth/types.js';

	// Props
	let { initialData }: { initialData?: { activeUser?: GetActiveUserType } } = $props();

	// Auth
	const auth = useAuth();

	// Query
	const activeUserResponse = useQuery(
		api.users.queries.getActiveUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeUser
		})
	);
	const activeUser = $derived(activeUserResponse?.data);

	// State
	let isEditingEmail: boolean = $state(false);
	let newEmail: string = $state('');
	let isSubmitting: boolean = $state(false);
	let emailInputEl: HTMLInputElement | null = $state(null);

	// Initialize form value when user data is available and not editing
	$effect(() => {
		if (activeUser && !isEditingEmail) {
			newEmail = activeUser.email;
		}
	});

	// Handle form submission to change email
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!newEmail.trim()) {
			toast.error('Please enter a valid email address');
			return;
		}

		if (newEmail === activeUser?.email) {
			toast.error('New email must be different from current email');
			return;
		}

		try {
			isSubmitting = true;

			// Come back to this page from the verification link
			const currentUrl = new URL(page.url.href);
			await authClient.changeEmail({
				newEmail,
				callbackURL: currentUrl.toString()
			});
			isEditingEmail = false;
			toast.success('Verification email sent to your new email address');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to change email: ${errorMsg}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if !activeUser}
	<div class="loading bone"></div>
{:else}
	<ProfileField
		label="Email address"
		editing={isEditingEmail}
		editLabel="Change email"
		onedit={async () => {
			isEditingEmail = true;
			newEmail = activeUser.email;
			await tick();
			emailInputEl?.focus();
			emailInputEl?.select();
		}}
	>
		{#snippet icon()}<PencilIcon class="size-4" />{/snippet}
		{#snippet view()}
			{#if activeUser.email.endsWith('.invalid')}
				<!-- A phone-only sign-up only has a placeholder address -->
				<span class="muted">Add an email address</span>
			{:else}
				<span class="truncate">{activeUser.email}</span>
				{#if activeUser.emailVerified}
					<Pill tone="ok">Verified</Pill>
				{:else}
					<Pill tone="warn">Not verified</Pill>
				{/if}
			{/if}
		{/snippet}
		{#snippet edit()}
			<form onsubmit={handleSubmit} class="form">
				<Field label="New email address" hideLabel>
					<input
						bind:this={emailInputEl}
						type="email"
						bind:value={newEmail}
						placeholder="Enter new email address"
						required
						disabled={isSubmitting}
					/>
				</Field>
				<div class="actions">
					<Button
						onclick={() => {
							newEmail = activeUser.email;
							isEditingEmail = false;
						}}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						disabled={isSubmitting ||
							!newEmail ||
							newEmail.trim() === '' ||
							newEmail === activeUser.email}
					>
						{isSubmitting ? 'Verifying...' : 'Verify email'}
					</Button>
				</div>
			</form>
		{/snippet}
	</ProfileField>
{/if}

<style lang="postcss">
	@reference 'src/app.css';

	.loading {
		@apply h-16 w-full rounded-xl;
	}
	.muted {
		@apply text-sm text-text-muted;
	}
	.form {
		@apply flex flex-col gap-3;
	}
	.actions {
		@apply grid grid-cols-2 gap-2;
	}
</style>
