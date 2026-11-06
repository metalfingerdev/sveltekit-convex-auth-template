<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	// SvelteKit
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Password from '../../../lib/primitives/ui/password/index.js';

	// Icons
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';

	// API
	import { authClient } from '../../../lib/auth/api/auth-client.js';
	import { onMount } from 'svelte';

	type ResetState = 'loading' | 'valid-token' | 'invalid-token' | 'error';

	// State
	let resetState: ResetState = $state('loading');
	let password: string = $state('');
	let confirmPassword: string = $state('');
	let isSubmitting: boolean = $state(false);
	let token: string | null = $state(null);

	// Extract token from URL parameters and validate
	onMount(() => {
		const tokenParam = page.url.searchParams.get('token');
		const errorParam = page.url.searchParams.get('error');

		if (errorParam === 'INVALID_TOKEN') {
			resetState = 'invalid-token';
		} else if (tokenParam) {
			token = tokenParam;
			resetState = 'valid-token';
		} else {
			resetState = 'invalid-token';
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		form.dataset.submitted = 'true';
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (!token) {
			toast.error('Invalid reset token');
			return;
		}

		isSubmitting = true;

		try {
			const { error } = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (error) {
				throw new Error(error.message || 'Failed to reset password');
			}
			toast.success('Password reset successfully!');

			// Redirect immediately to sign in
			goto(resolve('signin'));
		} catch (error) {
			console.error('Reset password error:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to reset password. Please try again.';

			if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
				resetState = 'invalid-token';
				toast.error('Reset link has expired or is invalid. Please request a new one.');
			} else {
				resetState = 'error';
				toast.error(errorMessage);
			}
		} finally {
			isSubmitting = false;
		}
	}

	function handleTryAgain() {
		resetState = 'valid-token';
		password = '';
		confirmPassword = '';
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<div class="flex h-full w-full max-w-md flex-col p-8">
		<div class="mb-4">
			<h1 class="w-full text-left text-lg leading-8 font-extrabold">
				{resetState === 'valid-token' ? 'Reset your password' : 'Invalid or Expired Link'}
			</h1>
			{#if resetState === 'valid-token'}
				<p class="text-text-muted mt-2 max-w-96 text-left text-sm">
					Enter your new password below.
				</p>
			{/if}
		</div>

		<div class="flex flex-col justify-center">
			{#if resetState === 'loading'}
				<div class="flex flex-col items-center gap-4">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					<p class="text-text-muted text-sm">Verifying reset link...</p>
				</div>
			{:else if resetState === 'invalid-token'}
				<div class="flex flex-col gap-6">
					<div>
						<p class="text-text-muted mt-2 text-sm">
							This password reset link is invalid or has expired.
							<br />
							Please request a new password reset link.
						</p>
					</div>
					<Button href={resolve('signin')} variant="primary">Back to Sign In</Button>
				</div>
			{:else if resetState === 'valid-token'}
				<form onsubmit={handleSubmit} novalidate class="flex w-full flex-col gap-8">
					<!-- Inputs -->
					<div class="flex flex-col gap-5">
						<Field label="New Password">
							<Password.Root>
								<Password.Input
									bind:value={password}
									placeholder="Enter your new password"
									required
									disabled={isSubmitting}
								>
									<Password.ToggleVisibility />
								</Password.Input>
								<Password.Error />
								<Password.Strength />
							</Password.Root>
						</Field>

						<Field label="Confirm New Password">
							<Password.Root minScore={0}>
								<Password.Input
									bind:value={confirmPassword}
									placeholder="Enter your new password"
									required
									disabled={isSubmitting}
								>
									<Password.ToggleVisibility />
								</Password.Input>
							</Password.Root>
						</Field>
					</div>

					<div class="flex flex-col gap-2">
						<Button type="submit" variant="primary" block disabled={isSubmitting}>
							{#if isSubmitting}
								<div class="flex items-center gap-2">
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
									></div>
									Resetting password...
								</div>
							{:else}
								Reset Password
							{/if}
						</Button>

						<Button href={resolve('signin')}>Back to Sign In</Button>
					</div>
				</form>
			{:else}
				<!-- error state -->
				<div class="flex flex-col items-center gap-6">
					<div class="bg-danger-tint text-danger rounded-full p-3">
						<AlertTriangleIcon class="size-6" />
					</div>
					<div class="text-center">
						<h2 class="text-text text-xl font-semibold">Something went wrong</h2>
						<p class="text-text-muted mt-2 text-sm">
							There was an error resetting your password.
							<br />
							Please try again or request a new reset link.
						</p>
					</div>
					<div class="flex gap-2">
						<Button href={resolve('signin')}>Back to Sign In</Button>
						<Button variant="primary" onclick={handleTryAgain}>
							Try Again
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
