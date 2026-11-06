<script lang="ts">
	// Svelte
	import { onDestroy, tick } from 'svelte';
	import { toast } from 'svelte-sonner';

	// API
	import { useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { api, authClient } = getAuthContext();

	// Icons
	import ProfileField from './ProfileField.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	import Pill from '#lib/ui/Pill.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';

	// Utils
	import { normalizeIndianMobile } from '#convex/otp/phone.js';

	// Types
	import type { GetActiveUserType } from '../../auth/types.js';

	let { initialData }: { initialData?: { activeUser?: GetActiveUserType } } = $props();

	const auth = useAuth();
	const activeUserResponse = useQuery(
		api.users.queries.getActiveUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({ initialData: initialData?.activeUser })
	);
	const activeUser = $derived(activeUserResponse?.data);
	const currentPhone = $derived(activeUser?.phoneNumber ?? null);

	const RESEND_SECONDS = 30;

	let isEditing = $state(false);
	let step = $state<'phone' | 'code'>('phone');
	let phoneInput = $state('');
	let pendingPhone = $state(''); // E.164 the code was sent to
	let code = $state('');
	let isSubmitting = $state(false);
	let resendIn = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;
	let phoneInputEl: HTMLInputElement | null = $state(null);
	let codeInputEl: HTMLInputElement | null = $state(null);

	const normalized = $derived(normalizeIndianMobile(phoneInput));

	onDestroy(() => clearInterval(timer));

	function formatPhone(e164: string): string {
		const n = e164.replace(/^\+91/, '');
		return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
	}

	function startResendTimer(): void {
		resendIn = RESEND_SECONDS;
		clearInterval(timer);
		timer = setInterval(() => {
			resendIn -= 1;
			if (resendIn <= 0) clearInterval(timer);
		}, 1000);
	}

	async function startEditing(): Promise<void> {
		isEditing = true;
		step = 'phone';
		phoneInput = '';
		code = '';
		await tick();
		phoneInputEl?.focus();
	}

	function cancel(): void {
		isEditing = false;
		step = 'phone';
		code = '';
		clearInterval(timer);
		resendIn = 0;
	}

	async function sendCode(target: string): Promise<boolean> {
		isSubmitting = true;
		const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: target });
		isSubmitting = false;
		if (error) {
			toast.error(error.message || "Couldn't send the code. Please try again.");
			return false;
		}
		toast.success('Code sent by SMS');
		startResendTimer();
		return true;
	}

	async function handlePhoneSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!normalized) {
			toast.error('Enter a valid 10-digit mobile number');
			return;
		}
		if (normalized === currentPhone) {
			toast.error('This is already your number');
			return;
		}
		if (await sendCode(normalized)) {
			pendingPhone = normalized;
			step = 'code';
			await tick();
			codeInputEl?.focus();
		}
	}

	async function handleCodeSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		isSubmitting = true;
		// updatePhoneNumber attaches the number to the signed-in user instead of signing in as its owner
		const { error } = await authClient.phoneNumber.verify({
			phoneNumber: pendingPhone,
			code,
			updatePhoneNumber: true
		});
		isSubmitting = false;
		if (error) {
			toast.error(error.message || 'Invalid code. Please try again.');
			code = '';
			return;
		}
		toast.success(currentPhone ? 'Mobile number updated' : 'Mobile number added');
		cancel();
	}
</script>

{#if !activeUser}
	<div class="loading bone"></div>
{:else}
	<ProfileField
		label="Mobile number"
		editing={isEditing}
		editLabel={currentPhone ? 'Change mobile number' : 'Add mobile number'}
		onedit={startEditing}
	>
		{#snippet icon()}
			{#if currentPhone}<PencilIcon class="size-4" />{:else}<PlusIcon class="size-4" />{/if}
		{/snippet}
		{#snippet view()}
			{#if currentPhone}
				<span class="truncate">{formatPhone(currentPhone)}</span>
				{#if activeUser.phoneNumberVerified}
					<Pill tone="ok">Verified</Pill>
				{:else}
					<Pill tone="warn">Not verified</Pill>
				{/if}
			{:else}
				<span class="muted">Add a mobile number</span>
			{/if}
		{/snippet}
		{#snippet edit()}
			{#if step === 'phone'}
				<form onsubmit={handlePhoneSubmit} class="form">
					<div class="number">
						<span class="prefix" aria-hidden="true">+91</span>
						<Field label="Mobile number" hideLabel>
							<input
								bind:this={phoneInputEl}
								type="tel"
								inputmode="numeric"
								autocomplete="tel-national"
								bind:value={phoneInput}
								placeholder="10-digit mobile number"
								maxlength="16"
								required
								disabled={isSubmitting}
							/>
						</Field>
					</div>
					<div class="actions">
						<Button onclick={cancel} disabled={isSubmitting}>Cancel</Button>
						<Button type="submit" variant="primary" disabled={isSubmitting || !normalized}>
							{isSubmitting ? 'Sending...' : 'Send code'}
						</Button>
					</div>
				</form>
			{:else}
				<form onsubmit={handleCodeSubmit} autocomplete="off" class="form">
					<p class="muted">Enter the code sent to {formatPhone(pendingPhone)}</p>
					<Field label="Code" hideLabel>
						<input
							bind:this={codeInputEl}
							type="text"
							class="code"
							bind:value={code}
							placeholder="••••••"
							pattern="[0-9]*"
							inputmode="numeric"
							maxlength="6"
							autocomplete="one-time-code"
							required
							disabled={isSubmitting}
						/>
					</Field>
					<div class="actions">
						<Button onclick={cancel} disabled={isSubmitting}>Cancel</Button>
						<Button type="submit" variant="primary" disabled={isSubmitting || code.trim().length !== 6}>
							{isSubmitting ? 'Verifying...' : 'Verify'}
						</Button>
					</div>
					<Button onclick={() => sendCode(pendingPhone)} disabled={isSubmitting || resendIn > 0}>
						{resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
					</Button>
				</form>
			{/if}
		{/snippet}
	</ProfileField>
{/if}

<style lang="postcss">
	@reference 'src/app.css';

	.loading {
		@apply h-16 w-full rounded-container;
	}
	.muted {
		@apply text-sm text-text-muted;
	}
	.form {
		@apply flex flex-col gap-3;
	}
	.number {
		@apply flex items-end gap-2;
	}
	.number :global(.field) {
		@apply min-w-0 flex-1;
	}
	.prefix {
		--fill: var(--color-foreground);
		@apply edge-flat grid min-h-11 shrink-0 place-items-center rounded-base bg-foreground px-3 text-text-muted;
	}
	.code {
		@apply tracking-[0.4em];
	}
	.actions {
		@apply grid grid-cols-2 gap-2;
	}
</style>
