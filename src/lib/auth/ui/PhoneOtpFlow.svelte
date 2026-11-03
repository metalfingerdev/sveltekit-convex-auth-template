<script lang="ts">
	// Svelte
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Utils
	import { normalizeIndianMobile } from '#convex/otp/phone.js';

	// API
	import { getAuthContext } from '../context.svelte.js';
	const { authClient } = getAuthContext();

	interface PhoneOtpFlowProps {
		onSuccess: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		/** Shown as "Continue with email instead" when email sign-in is also enabled */
		onUseEmail?: () => void;
		/** Lets the parent show a title for the current step */
		onStepChange?: (step: PhoneStep) => void;
	}

	type PhoneStep = 'phone' | 'code' | 'name';

	let { onSuccess, submitting, onSubmittingChange, onUseEmail, onStepChange }: PhoneOtpFlowProps =
		$props();

	const RESEND_SECONDS = 30;

	let step = $state<PhoneStep>('phone');
	let phoneInput = $state('');
	let phoneNumber = $state(''); // E.164, set once the code is sent
	let code = $state('');
	let name = $state('');
	let sending = $state(false);
	let resendIn = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;

	const normalized = $derived(normalizeIndianMobile(phoneInput));
	const busy = $derived(submitting || sending);

	$effect(() => onStepChange?.(step));

	function startResendTimer(): void {
		resendIn = RESEND_SECONDS;
		clearInterval(timer);
		timer = setInterval(() => {
			resendIn -= 1;
			if (resendIn <= 0) clearInterval(timer);
		}, 1000);
	}

	onDestroy(() => clearInterval(timer));

	/**
	 * Sends (or resends) the code. Rate limit and delivery errors come back with a readable message.
	 */
	async function sendCode(target: string): Promise<boolean> {
		sending = true;
		let ok = false;
		try {
			await authClient.phoneNumber.sendOtp(
				{ phoneNumber: target },
				{
					onSuccess: () => {
						ok = true;
						toast.success('Code sent by SMS');
					},
					onError: (ctx) => {
						console.error('Phone OTP send error:', ctx.error);
						toast.error(ctx.error.message || "Couldn't send the code. Please try again.");
					}
				}
			);
		} finally {
			sending = false;
		}
		if (ok) startResendTimer();
		return ok;
	}

	async function handlePhoneSubmit(event: Event): Promise<void> {
		event.preventDefault();
		if (!normalized) {
			toast.error('Enter a valid 10-digit mobile number');
			return;
		}
		if (await sendCode(normalized)) {
			phoneNumber = normalized;
			code = '';
			step = 'code';
		}
	}

	async function handleCodeSubmit(event: Event): Promise<void> {
		event.preventDefault();
		onSubmittingChange(true);
		await authClient.phoneNumber.verify(
			{ phoneNumber, code },
			{
				onSuccess: (ctx) => {
					// New phone-only accounts get the number as a placeholder name (convex/auth.ts)
					const user = ctx.data?.user as { name?: string } | undefined;
					if (user?.name === phoneNumber) {
						onSubmittingChange(false);
						step = 'name';
						return;
					}
					onSuccess();
				},
				onError: (ctx) => {
					console.error('Phone OTP verify error:', ctx.error);
					toast.error(ctx.error.message || 'Invalid code. Please try again.');
					code = '';
					onSubmittingChange(false);
				}
			}
		);
	}

	async function handleNameSubmit(event: Event): Promise<void> {
		event.preventDefault();
		onSubmittingChange(true);
		await authClient.updateUser(
			{ name: name.trim() },
			{
				onSuccess,
				onError: (ctx) => {
					console.error('Profile update error:', ctx.error);
					toast.error(ctx.error.message || 'Signed in, but failed to save your name.');
					onSubmittingChange(false);
				}
			}
		);
	}

	function changeNumber(): void {
		step = 'phone';
		code = '';
		clearInterval(timer);
		resendIn = 0;
	}

	function formatPhone(e164: string): string {
		const n = e164.replace(/^\+91/, '');
		return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
	}
</script>

{#if step === 'phone'}
	<form onsubmit={handlePhoneSubmit} class="flex flex-col gap-8">
		<div class="flex flex-col">
			<label class="label" for="phone">Mobile number</label>
			<div class="flex gap-2">
				<span
					class="input preset-filled-surface-200 text-surface-600-400 w-auto shrink-0 text-sm"
					aria-hidden="true">+91</span
				>
				<input
					id="phone"
					name="phone"
					type="tel"
					inputmode="numeric"
					autocomplete="tel-national"
					bind:value={phoneInput}
					class="input preset-filled-surface-200 min-w-0 flex-1 text-sm"
					placeholder="Enter 10-digit mobile number"
					maxlength="16"
					required
					disabled={busy}
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<button type="submit" class="btn preset-filled w-full" disabled={busy || !normalized}>
				{#if sending}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Sending...
					</div>
				{:else}
					Continue
				{/if}
			</button>
			{#if onUseEmail}
				<button type="button" class="btn" onclick={onUseEmail} disabled={busy}>
					Continue with email instead
				</button>
			{/if}
		</div>
	</form>
{:else if step === 'code'}
	<form onsubmit={handleCodeSubmit} autocomplete="off" class="flex flex-col gap-8">
		<div class="flex flex-col gap-5">
			<p class="text-surface-600-400 text-sm">
				Enter the 6-digit code sent to <strong class="text-surface-950-50"
					>{formatPhone(phoneNumber)}</strong
				>
			</p>
			<div class="flex flex-col">
				<label class="label" for="otp">Verification code</label>
				<input
					id="otp"
					type="text"
					bind:value={code}
					class="input preset-filled-surface-200 tracking-[0.4em]"
					placeholder="••••••"
					pattern="[0-9]*"
					inputmode="numeric"
					maxlength="6"
					autocomplete="one-time-code"
					required
					disabled={submitting}
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<button
				type="submit"
				class="btn preset-filled w-full"
				disabled={submitting || code.trim().length !== 6}
			>
				{#if submitting}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Verifying...
					</div>
				{:else}
					Verify
				{/if}
			</button>
			<button
				type="button"
				class="btn preset-tonal w-full"
				onclick={() => sendCode(phoneNumber)}
				disabled={busy || resendIn > 0}
			>
				{#if sending}
					Sending...
				{:else if resendIn > 0}
					Resend code in {resendIn}s
				{:else}
					Resend code
				{/if}
			</button>
			<button type="button" class="btn" onclick={changeNumber} disabled={busy}>
				Change number
			</button>
		</div>
	</form>
{:else}
	<form onsubmit={handleNameSubmit} class="flex flex-col gap-8">
		<div class="flex flex-col">
			<label class="label" for="name">Full name</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				class="input preset-filled-surface-200"
				placeholder="Enter your full name"
				autocomplete="name"
				required
				disabled={submitting}
			/>
		</div>

		<button type="submit" class="btn preset-filled w-full" disabled={submitting || !name.trim()}>
			{#if submitting}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Saving...
				</div>
			{:else}
				Continue
			{/if}
		</button>
	</form>
{/if}
