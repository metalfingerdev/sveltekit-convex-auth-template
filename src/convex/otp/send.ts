/**
 * The OTP dispatcher. Better Auth's `phoneNumber` plugin calls `sendOtp` (wired in convex/auth.ts)
 * with a code it generated and stored; this decides how to get it to the phone:
 *
 *   rate limit -> for each channel in OTP_CHANNELS: skip if unconfigured, try, log -> first success wins
 *
 * Throwing here fails the Better Auth request, so the client shows an error instead of waiting
 * for a code that will never arrive.
 */
import { APIError } from 'better-auth/api';
import { internal } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';
import { CHANNELS } from './channels';
import { getChannelOrder } from './config';
import { isValidIndianMobile, maskPhone } from './phone';
import { otpRateLimiter } from './rateLimits';
import type { OtpChannelId } from './types';

export async function sendOtp(
	ctx: ActionCtx,
	{ phoneNumber, code }: { phoneNumber: string; code: string }
): Promise<{ channel: OtpChannelId }> {
	// The plugin's phoneNumberValidator already ran; this guards other callers
	if (!isValidIndianMobile(phoneNumber)) {
		throw new APIError('BAD_REQUEST', { message: 'Enter a valid Indian mobile number.' });
	}

	const perPhone = await otpRateLimiter.limit(ctx, 'otpPerPhone', { key: phoneNumber });
	const global = perPhone.ok ? await otpRateLimiter.limit(ctx, 'otpGlobal') : perPhone;
	if (!perPhone.ok || !global.ok) {
		await ctx.runMutation(internal.otp.deliveries.record, {
			phoneNumber,
			status: 'rate_limited',
			error: perPhone.ok ? 'global limit' : 'per-phone limit'
		});
		const seconds = Math.ceil(((perPhone.ok ? global.retryAfter : perPhone.retryAfter) ?? 0) / 1000);
		throw new APIError('TOO_MANY_REQUESTS', {
			message: `Too many codes requested. Try again in ${seconds} seconds.`
		});
	}

	const errors: string[] = [];
	for (const id of getChannelOrder()) {
		const channel = CHANNELS[id];
		if (!channel.isConfigured()) continue;

		const result = await channel.send({ to: phoneNumber, code });
		await ctx.runMutation(internal.otp.deliveries.record, {
			phoneNumber,
			channel: id,
			status: result.ok ? 'sent' : 'failed',
			providerMessageId: result.ok ? result.providerMessageId : undefined,
			error: result.ok ? result.warning : result.error
		});

		if (result.ok) return { channel: id };
		errors.push(`${id}: ${result.error}`);
		if (!result.retryable) break;
	}

	console.error(
		`[otp] no channel delivered to ${maskPhone(phoneNumber)}`,
		errors.length ? errors : 'no channel in OTP_CHANNELS is configured'
	);
	throw new APIError('INTERNAL_SERVER_ERROR', {
		message: "We couldn't send your code right now. Please try again."
	});
}
