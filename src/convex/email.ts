import './polyfills';
import {
	renderVerifyEmail,
	renderMagicLink,
	renderVerifyOTP,
	renderResetPassword,
	renderChangeEmailVerification,
	renderInviteMember
} from './model/emails/templates/emailTemplates';
import { BRAND_NAME } from './model/emails/templates/baseEmail';
import { type ActionCtx } from './_generated/server';

import { Resend } from '@convex-dev/resend';
import { APIError } from 'better-auth/api';
import { components } from './_generated/api';
import { emailRateLimiter } from './model/emails/rateLimits';

const EMAIL_SEND_FROM = process.env.EMAIL_SEND_FROM;
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL;

// Reads RESEND_API_KEY and RESEND_WEBHOOK_SECRET from the Convex env
export const resend: Resend = new Resend(components.resend, {
	testMode: false
});

/**
 * Addresses on a reserved `.invalid` domain can't receive mail. Phone-only sign-ups get one as a
 * placeholder (`otp/config.ts` phoneSignUpEmail), so skip them instead of bouncing through Resend.
 */
const isUndeliverable = (to: string) => to.toLowerCase().endsWith('.invalid');

const sendAuthEmail = async (
	ctx: ActionCtx,
	{ to, subject, html }: { to: string; subject: string; html: string }
) => {
	if (isUndeliverable(to)) {
		console.warn(`[email] skipped "${subject}": placeholder address`);
		return;
	}
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, { from: EMAIL_SEND_FROM, to, subject, html });
};

export const sendEmailVerification = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	if (isUndeliverable(to)) return;
	const key = to.trim().toLowerCase();
	const perEmail = await emailRateLimiter.limit(ctx, 'verificationPerEmail', { key });
	const global = perEmail.ok ? await emailRateLimiter.limit(ctx, 'verificationGlobal') : perEmail;
	if (!perEmail.ok || !global.ok) {
		const seconds = Math.ceil(((perEmail.ok ? global.retryAfter : perEmail.retryAfter) ?? 0) / 1000);
		throw new APIError('TOO_MANY_REQUESTS', {
			message: `Too many verification emails requested. Try again in ${seconds} seconds.`
		});
	}

	await sendAuthEmail(ctx, {
		to,
		subject: 'Verify your email address',
		html: renderVerifyEmail({
			url,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendOTPVerification = async (
	ctx: ActionCtx,
	{
		to,
		code
	}: {
		to: string;
		code: string;
	}
) => {
	await sendAuthEmail(ctx, {
		to,
		subject: `${code} is your verification code`,
		html: renderVerifyOTP({
			code,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendMagicLink = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	await sendAuthEmail(ctx, {
		to,
		subject: `Sign in to ${BRAND_NAME}`,
		html: renderMagicLink({
			url,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendResetPassword = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	await sendAuthEmail(ctx, {
		to,
		subject: 'Reset your password',
		html: renderResetPassword({
			url,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendChangeEmailVerification = async (
	ctx: ActionCtx,
	{
		to,
		url,
		newEmail,
		userName
	}: {
		to: string;
		url: string;
		newEmail: string;
		userName?: string;
	}
) => {
	await sendAuthEmail(ctx, {
		to,
		subject: 'Confirm your email address change',
		html: renderChangeEmailVerification({
			url,
			newEmail,
			userName,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendInviteMember = async (
	ctx: ActionCtx,
	{
		to,
		url,
		inviter,
		organization
	}: {
		to: string;
		url: string;
		inviter: {
			name: string;
			email: string;
			image?: string;
		};
		organization: {
			name: string;
			logo?: string;
		};
	}
) => {
	await sendAuthEmail(ctx, {
		to,
		subject: `Join ${organization.name} on ${BRAND_NAME}`,
		html: renderInviteMember({
			url,
			inviter,
			organization,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};
