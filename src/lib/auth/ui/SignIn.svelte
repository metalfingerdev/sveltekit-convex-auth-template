<script lang="ts">
	// Sveltekit
	import { page } from '$app/state';
	import { gotoApp } from '../../primitives/utils/navigation.js';
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// Components
	import EmailStep from './EmailStep.svelte';
	import PasswordFlow from './PasswordFlow.svelte';
	import EmailOtpFlow from './EmailOtpFlow.svelte';
	import MagicLinkFlow from './MagicLinkFlow.svelte';
	import SocialFlow from './SocialFlow.svelte';
	import PhoneOtpFlow from './PhoneOtpFlow.svelte';
	// Icons
	import MailIcon from '@lucide/svelte/icons/mail';

	// Utils
	import { safeRedirect } from '../utils/safeRedirect.js';
	import {
		resolveSignInCallbackURL,
		resolveSignInRedirect
	} from '../utils/signInRedirect.js';

	// Context
	import { getAuthContext } from '../context.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	const { authConstants, authClient } = getAuthContext();

	// Types
	type AuthStep =
		| 'phone'
		| 'email' | 'password-flow' | 'email-otp-flow' | 'magic-link-flow' | 'verify-email' | 'success';
	type EmailAuthMethod = 'password' | 'emailOTP' | 'magicLink';

	interface SignInProps {
		onSignIn?: () => void;
		redirectTo?: string;
		class?: string;
	}

	let { onSignIn, redirectTo: redirectParam, class: className }: SignInProps = $props();

	// State
	// Phone-first when phone OTP is on (the usual pattern for Indian consumer apps)
	const phoneEnabled = $derived(Boolean(authConstants.providers.phoneOTP));
	const initialStep = (): AuthStep => (authConstants.providers.phoneOTP ? 'phone' : 'email');
	let currentStep = $state<AuthStep>(initialStep());
	let phoneStep = $state<'phone' | 'code' | 'name'>('phone');
	let email = $state('');
	let submitting = $state(false);
	let availableEmailMethods = $state<EmailAuthMethod[]>([]);
	let isSigningIn = $state(false);
	let redirectInProgress = $state(false);
	let passwordMode = $state<'login' | 'register'>('login');
	let otpMode = $state<'login' | 'register'>('login');
	let verifyContext = $state<'emailVerification' | 'magicLink'>('emailVerification');
	let magicLinkSent = $state(false);
	let emailExistsRef = $state(false);
	const RESEND_SECONDS = 30;
	let resendIn = $state(0);
	let isResending = $state(false);

	// Auth state
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const isLoading = $derived(auth.isLoading);

	// Initialize available methods
	$effect(() => {
		const methods: EmailAuthMethod[] = [];
		if (authConstants.providers.password) methods.push('password');
		if (authConstants.providers.emailOTP && authConstants.sendEmails) methods.push('emailOTP');
		if (authConstants.providers.magicLink && authConstants.sendEmails) methods.push('magicLink');
		availableEmailMethods = methods;
	});

	// Legal links (handle empty/null/undefined gracefully)
	const termsUrl = $derived((authConstants.terms ?? '').trim());
	const privacyUrl = $derived((authConstants.privacy ?? '').trim());
	const showTerms = $derived(Boolean(termsUrl));
	const showPrivacy = $derived(Boolean(privacyUrl));
	const showLegal = $derived(showTerms || showPrivacy);
	const brandName = $derived((authConstants.brandName ?? 'self hosted Auth').trim());
	const brandTagline = $derived(
		(authConstants.brandTagline ?? 'Plug & Play Auth Widgets for your application.').trim()
	);

	// Monitor authentication state and redirect once Convex auth is synchronized
	$effect(() => {
		if (isAuthenticated && !isLoading && isSigningIn && !redirectInProgress) {
			redirectInProgress = true;
			// Always close the dialog when authenticated
			onSignIn?.();
			console.log('Convex auth synchronized, redirecting...');
			void finalizeSignIn();
		}
	});

	/**
	 * Gets the redirect URL based on redirectTo or current URL params
	 */
	function getRedirectURL(): string | undefined {
		return resolveSignInRedirect(redirectParam, page.url);
	}

	/**
	 * Absolute same-origin callback URL for Better Auth flows that leave the page
	 */
	function getCallbackURL(): string {
		return (
			page.url.origin +
			safeRedirect(resolveSignInCallbackURL(redirectParam, page.url), '/', page.url.origin)
		);
	}

	/**
	 * Handles the redirect after successful authentication; a target on another host goes home
	 */
	async function handleRedirect(): Promise<void> {
		const redirectURL = getRedirectURL();
		if (!redirectURL) return;

		const target = safeRedirect(redirectURL, '/', page.url.origin);
		await gotoApp(target, { refreshAll: true });
	}

	/**
	 * Completes sign-in by keeping the loading UI active until navigation fully settles
	 */
	async function finalizeSignIn(): Promise<void> {
		try {
			await handleRedirect();
		} catch (error) {
			console.error('Sign-in redirect failed:', error);
		} finally {
			submitting = false;
			isSigningIn = false;
			redirectInProgress = false;
		}
	}

	/**
	 * Handles successful authentication
	 */
	function handleAuthSuccess(): void {
		// Set flag to monitor auth state instead of immediate redirect
		submitting = true;
		isSigningIn = true;
	}

	// Count down the resend cooldown on the "Check your email" screen
	$effect(() => {
		if (resendIn <= 0) return;
		const timer = setTimeout(() => (resendIn -= 1), 1000);
		return () => clearTimeout(timer);
	});

	// Start the cooldown whenever the verification screen opens, since an email just went out
	$effect(() => {
		if (currentStep === 'verify-email') resendIn = RESEND_SECONDS;
	});

	/**
	 * Sends another verification link to the email on the "Check your email" screen
	 */
	async function handleResendVerification(): Promise<void> {
		isResending = true;
		const { error } = await authClient.sendVerificationEmail({
			email,
			callbackURL: getCallbackURL()
		});
		isResending = false;
		if (error) {
			toast.error(error.message || 'Could not resend the email. Please try again.');
			return;
		}
		resendIn = RESEND_SECONDS;
		toast.success('Verification email sent!');
	}

	/**
	 * Resets the flow back to email step
	 */
	function resetToEmailStep(): void {
		currentStep = 'email';
		email = '';
		submitting = false;
		isSigningIn = false;
		redirectInProgress = false;
		passwordMode = 'login';
		otpMode = 'login';
		verifyContext = 'emailVerification';
		magicLinkSent = false;
		emailExistsRef = false;
	}

	/**
	 * Handles method selection from email step
	 */
	async function handleMethodSelect(method: EmailAuthMethod, emailExists: boolean): Promise<void> {
		emailExistsRef = emailExists;

		// Existing user + magic link: send directly, skip MagicLinkFlow UI
		if (method === 'magicLink' && emailExists) {
			await authClient.signIn.magicLink(
				{
					email,
					callbackURL: getCallbackURL(),
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						verifyContext = 'magicLink';
						magicLinkSent = true;
						isSigningIn = true;
						toast.success('Magic link sent to your email!');
					},
					onError: (ctx) => {
						console.error('Magic link send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
					}
				}
			);
			return;
		}

		// Email OTP: send OTP directly while EmailStep button shows "Sending..."
		if (method === 'emailOTP') {
			let otpSendSuccess = false;
			await authClient.emailOtp.sendVerificationOtp(
				{ email, type: 'sign-in' },
				{
					onSuccess: () => {
						otpSendSuccess = true;
						toast.success('Verification code sent to your email!');
					},
					onError: (ctx) => {
						console.error('OTP send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send verification code. Please try again.');
					}
				}
			);
			if (otpSendSuccess) {
				otpMode = emailExists ? 'login' : 'register';
				currentStep = 'email-otp-flow';
			}
			return;
		}

		// Navigate to the appropriate step based on method
		switch (method) {
			case 'password':
				passwordMode = emailExists ? 'login' : 'register';
				currentStep = 'password-flow';
				break;
			case 'magicLink':
				currentStep = 'magic-link-flow';
				break;
		}
	}

	/**
	 * Gets the step title based on current step
	 */
	function getStepTitle(): string {
		switch (currentStep) {
			case 'password-flow':
				return passwordMode === 'register'
					? 'Create account with password'
					: 'Sign in with password';
			case 'email-otp-flow':
				return otpMode === 'register'
					? 'Create account with verification code'
					: 'Sign in with verification code';
			case 'magic-link-flow':
				return 'Sign in with magic link';
			case 'phone':
				if (phoneStep === 'code') return 'Verify your number';
				if (phoneStep === 'name') return 'One last thing';
				return `Log in or sign up to ${brandName}`;
			default:
				return `Sign in to ${brandName}`;
		}
	}

	/**
	 * Gets the step description based on current step
	 */
	function getStepDescription(): string {
		switch (currentStep) {
			case 'password-flow':
				return passwordMode === 'register'
					? 'Create a password to continue.'
					: 'Enter your password to continue.';
			case 'email-otp-flow':
				return 'Enter the verification code we sent to your email address.';
			case 'magic-link-flow':
				return "We'll send a magic link to your email address.";
			case 'phone':
				if (phoneStep === 'code') return "We've sent you a code by SMS.";
				if (phoneStep === 'name') return 'What should we call you?';
				return "Enter your mobile number. We'll send you a code to verify it.";
			default:
				return brandTagline;
		}
	}

	// Reset function that an external component can call
	export function reset() {
		resetToEmailStep();
		currentStep = initialStep();
	}

	// If the current step is no longer valid for the current config,
	// snap back to the email step so the UI always has something to render
	$effect(() => {
		const set = new Set(availableEmailMethods);

		const isPassword = currentStep === 'password-flow';
		const isOtp = currentStep === 'email-otp-flow';
		const isMagic = currentStep === 'magic-link-flow';
		const isVerifyEmail = currentStep === 'verify-email';

		// no email sending → no verify/magic/otp screens
		if (!authConstants.sendEmails && (isVerifyEmail || isMagic || isOtp)) {
			resetToEmailStep();
			return;
		}

		if (currentStep === 'phone' && !phoneEnabled) {
			resetToEmailStep();
			return;
		}

		// step-specific availability checks
		if (isPassword && !set.has('password')) resetToEmailStep();
		if (isOtp && !set.has('emailOTP')) resetToEmailStep();
		if (isMagic && !set.has('magicLink')) resetToEmailStep();
	});
</script>

<div class="signin {className ?? ''}">
	{#if authConstants.sendEmails && (currentStep === 'verify-email' || (verifyContext === 'magicLink' && magicLinkSent))}
		<div class="verify">
			<span class="mail"><MailIcon class="size-8" aria-hidden="true" /></span>

			<h3 class="title">Check your email</h3>
			<p class="muted">
				{#if verifyContext === 'magicLink'}
					We've sent a magic link to <strong>{email}</strong>.
				{:else}
					We've sent a verification link to <strong>{email}</strong>.
				{/if}
			</p>
			<p class="muted">
				{#if verifyContext === 'magicLink'}
					Click the link in your email to sign in instantly.
				{:else}
					Click the link to verify your email. You'll be signed in automatically after verification.
				{/if}
			</p>

			<div class="actions">
				{#if verifyContext === 'emailVerification'}
					<Button
						variant="primary"
						large
						block
						onclick={handleResendVerification}
						disabled={isResending || resendIn > 0}
					>
						{#if isResending}
							Sending...
						{:else if resendIn > 0}
							Resend email in {resendIn}s
						{:else}
							Resend email
						{/if}
					</Button>
				{/if}
				<Button block onclick={resetToEmailStep}>Use a different email</Button>
			</div>
		</div>
	{:else}
		<h1 class="title">{getStepTitle()}</h1>
		<p class="muted lead">{getStepDescription()}</p>

		<div class="steps">
			<!-- Social Sign In -->
			<SocialFlow
				show={currentStep === 'email' || (currentStep === 'phone' && phoneStep === 'phone')}
				onSuccess={handleAuthSuccess}
				onSubmittingChange={(value) => (submitting = value)}
				callbackURL={getCallbackURL()}
				dividerAfter={availableEmailMethods.length > 0 || phoneEnabled}
			/>

			<!-- Phone OTP -->
			{#if phoneEnabled && currentStep === 'phone'}
				<PhoneOtpFlow
					onSuccess={handleAuthSuccess}
					{submitting}
					onSubmittingChange={(value) => (submitting = value)}
					onUseEmail={availableEmailMethods.length > 0 ? resetToEmailStep : undefined}
					onStepChange={(step) => (phoneStep = step)}
				/>
			{/if}

			<!-- Email-based Auth Methods -->
			{#if availableEmailMethods.length > 0}
				{#if currentStep === 'email'}
					<EmailStep
						{email}
						onEmailChange={(newEmail) => (email = newEmail)}
						onMethodSelect={handleMethodSelect}
						{submitting}
						availableMethods={availableEmailMethods}
					/>
					{#if phoneEnabled}
						<Button block onclick={() => (currentStep = 'phone')} disabled={submitting}>
							Continue with mobile number instead
						</Button>
					{/if}
				{:else if currentStep === 'password-flow'}
					<PasswordFlow
						{email}
						emailExists={emailExistsRef}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
						callbackURL={getCallbackURL()}
						onVerifyEmail={() => {
							currentStep = 'verify-email';
							verifyContext = 'emailVerification';
							isSigningIn = true;
						}}
					/>
				{:else if currentStep === 'email-otp-flow'}
					<EmailOtpFlow
						{email}
						emailExists={emailExistsRef}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
					/>
				{:else if currentStep === 'magic-link-flow'}
					<MagicLinkFlow
						{email}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
						callbackURL={getCallbackURL()}
						onLinkSent={() => {
							verifyContext = 'magicLink';
							magicLinkSent = true;
							isSigningIn = true;
						}}
					/>
				{/if}
			{/if}
		</div>

		{#if showLegal}
			<p class="legal">
				By continuing, you agree to our
				{#if showTerms}
					<a href={termsUrl} rel="external noreferrer">Terms</a>
				{/if}
				{#if showTerms && showPrivacy}
					and
				{/if}
				{#if showPrivacy}
					<a href={privacyUrl} rel="external noreferrer">Privacy Policies</a>
				{/if}
			</p>
		{/if}
	{/if}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	.signin {
		@apply mx-auto flex h-full w-full max-w-md flex-col justify-center gap-2 p-4 pb-8;
	}
	.title {
		@apply text-2xl leading-tight font-extrabold;
	}
	.muted {
		@apply text-sm text-text-muted;
	}
	.lead {
		@apply pb-6;
	}
	.steps {
		@apply flex w-full flex-col gap-6;
	}
	.verify {
		@apply flex flex-col gap-2;
	}
	.mail {
		--fill: var(--color-background);
		@apply edge-flat mb-2 grid size-16 place-items-center rounded-full bg-background text-text-muted;
	}
	.actions {
		@apply mt-4 flex flex-col gap-2;
	}
	.legal {
		@apply mt-6 text-xs text-text-muted;
	}
	.legal a {
		@apply font-bold text-text underline;
	}
</style>
