/**
 * Audit log of OTP delivery attempts, one row per channel tried. Never stores the code.
 * Use it to answer "why didn't I get my OTP?" and to compare channel reliability.
 */
import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { otpChannelId, otpDeliveryStatus } from '../schema';

export const record = internalMutation({
	args: {
		phoneNumber: v.string(),
		channel: v.optional(otpChannelId),
		status: otpDeliveryStatus,
		providerMessageId: v.optional(v.string()),
		error: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('otpDeliveries', args);
		return null;
	}
});
