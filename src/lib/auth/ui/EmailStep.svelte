<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '../context.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	const { api } = getAuthContext();

	type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

	interface EmailStepProps {
		email: string;
		onEmailChange: (email: string) => void;
		onMethodSelect: (method: AuthMethod, emailExists: boolean) => void | Promise<void>;
		submitting: boolean;
		availableMethods: AuthMethod[];
	}

	let { email, onEmailChange, onMethodSelect, submitting, availableMethods }: EmailStepProps =
		$props();

	const client = useConvexClient();
	let validatingEmail = $state(false);
	let validatingEmailMethod = $state<AuthMethod | null>(null);

	/**
	 * Gets the button text for single method scenarios
	 */
	function getSingleMethodButtonText(): string {
		if (availableMethods.length === 1) {
			switch (availableMethods[0]) {
				case 'password':
					return 'Continue';
				case 'emailOTP':
					return 'Continue';
				case 'magicLink':
					return 'Continue';
				default:
					return 'Continue';
			}
		}
		return 'Continue with Password';
	}

	/**
	 * Handles method selection and email validation
	 */
	async function handleMethodClick(method: AuthMethod): Promise<void> {
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		// Always validate the email before proceeding to any flow
		validatingEmail = true;
		validatingEmailMethod = method;
		try {
			const data = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
				email
			});
			if (!data.valid) {
				toast.error(data.reason || 'Please enter a valid email address.');
				return;
			}
			await onMethodSelect(method, data.exists);
		} catch (error) {
			toast.error('Failed to validate email. Please try again.');
			console.error('Email validation error:', error);
		} finally {
			validatingEmail = false;
			validatingEmailMethod = null;
		}
	}
</script>

<div class="form">
	<Field label="Email">
		<input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			value={email}
			oninput={(e) => onEmailChange(e.currentTarget.value)}
			placeholder="Enter your email"
			required
			disabled={submitting || validatingEmail}
		/>
	</Field>

	{#if availableMethods.length === 1}
		<!-- Single method available -->
		<Button
			variant="primary"
			large
			block
			onclick={() => handleMethodClick(availableMethods[0])}
			disabled={submitting || validatingEmail || !email}
		>
			{#if validatingEmail}
				<Spinner /> {validatingEmailMethod === 'password' ? 'Verifying...' : 'Sending...'}
			{:else}
				{getSingleMethodButtonText()}
			{/if}
		</Button>
	{:else}
		<!-- Multiple methods available -->
		<div class="actions">
			{#if availableMethods.includes('password')}
				<Button
					variant="primary"
					large
					block
					onclick={() => handleMethodClick('password')}
					disabled={submitting || validatingEmail || !email}
				>
					{#if validatingEmail && validatingEmailMethod === 'password'}
						<Spinner /> Verifying...
					{:else}
						Continue with Password
					{/if}
				</Button>
			{/if}

			{#if availableMethods.includes('emailOTP')}
				<Button
					block
					onclick={() => handleMethodClick('emailOTP')}
					disabled={submitting || validatingEmail || !email}
				>
					{#if validatingEmail && validatingEmailMethod === 'emailOTP'}
						<Spinner /> Sending...
					{:else}
						Continue with Email OTP
					{/if}
				</Button>
			{/if}

			{#if availableMethods.includes('magicLink')}
				<Button
					block
					onclick={() => handleMethodClick('magicLink')}
					disabled={submitting || validatingEmail || !email}
				>
					{#if validatingEmail && validatingEmailMethod === 'magicLink'}
						<Spinner /> Sending...
					{:else}
						Continue with Magic Link
					{/if}
				</Button>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	.form {
		@apply flex flex-col gap-5;
	}
	.actions {
		@apply flex flex-col gap-2;
	}
</style>
