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

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="placeholder h-16 w-full animate-pulse"></div>
	{:else}
		<div
			class={[
				'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': !isEditing,
					'hover:bg-surface-200-800': !isEditing,
					'hover:border-surface-200-800': !isEditing
				}
			]}
		>
			<div class="flex items-center justify-between gap-3">
				<div class="flex w-full flex-col">
					<span class="text-surface-600-400 text-xs">Mobile Number</span>

					{#if !isEditing}
						<div class="mt-1 flex items-center gap-2">
							{#if currentPhone}
								<span class="truncate text-sm">{formatPhone(currentPhone)}</span>
								{#if activeUser.phoneNumberVerified}
									<span class="badge preset-filled-success-100-900 text-xs">Verified</span>
								{:else}
									<span class="badge preset-filled-warning-100-900 text-xs">Not verified</span>
								{/if}
							{:else}
								<span class="text-surface-600-400 text-sm">Add a mobile number</span>
							{/if}
						</div>
					{:else if step === 'phone'}
						<form onsubmit={handlePhoneSubmit} class="mt-1 flex flex-col gap-3">
							<div class="flex gap-2">
								<span class="input text-surface-600-400 w-auto shrink-0 text-sm" aria-hidden="true"
									>+91</span
								>
								<input
									bind:this={phoneInputEl}
									type="tel"
									inputmode="numeric"
									autocomplete="tel-national"
									class="input min-w-0 flex-1"
									bind:value={phoneInput}
									placeholder="10-digit mobile number"
									maxlength="16"
									required
									disabled={isSubmitting}
								/>
							</div>
							<div class="mb-1 flex gap-1.5">
								<button
									type="button"
									class="btn btn-sm preset-tonal w-full"
									onclick={cancel}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									class="btn btn-sm preset-filled-primary-500 w-full"
									disabled={isSubmitting || !normalized}
								>
									{isSubmitting ? 'Sending...' : 'Send code'}
								</button>
							</div>
						</form>
					{:else}
						<form onsubmit={handleCodeSubmit} autocomplete="off" class="mt-1 flex flex-col gap-3">
							<p class="text-surface-600-400 text-xs">
								Enter the code sent to {formatPhone(pendingPhone)}
							</p>
							<input
								bind:this={codeInputEl}
								type="text"
								class="input w-full tracking-[0.4em]"
								bind:value={code}
								placeholder="••••••"
								pattern="[0-9]*"
								inputmode="numeric"
								maxlength="6"
								autocomplete="one-time-code"
								required
								disabled={isSubmitting}
							/>
							<div class="flex gap-1.5">
								<button
									type="button"
									class="btn btn-sm preset-tonal w-full"
									onclick={cancel}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									class="btn btn-sm preset-filled-primary-500 w-full"
									disabled={isSubmitting || code.trim().length !== 6}
								>
									{isSubmitting ? 'Verifying...' : 'Verify'}
								</button>
							</div>
							<button
								type="button"
								class="btn btn-sm mb-1"
								onclick={() => sendCode(pendingPhone)}
								disabled={isSubmitting || resendIn > 0}
							>
								{resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
							</button>
						</form>
					{/if}
				</div>

				{#if !isEditing}
					<div class="shrink-0">
						<span class="btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
							{#if currentPhone}
								<PencilIcon class="size-4" />
							{:else}
								<PlusIcon class="size-4" />
							{/if}
						</span>
					</div>
					<button
						class="absolute inset-0 h-full w-full"
						aria-label={currentPhone ? 'Change mobile number' : 'Add mobile number'}
						type="button"
						onclick={startEditing}
					></button>
				{/if}
			</div>
		</div>
	{/if}
</div>
