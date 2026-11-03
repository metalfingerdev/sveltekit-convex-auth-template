import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const otpChannelId = v.union(
	v.literal('textbee'),
	v.literal('whatsapp'),
	v.literal('fast2sms'),
	v.literal('console')
);

export const otpDeliveryStatus = v.union(
	v.literal('sent'), // the provider accepted it (not proof of delivery)
	v.literal('failed'),
	v.literal('rate_limited')
);

const schema = defineSchema({
	// See convex/otp/deliveries.ts
	otpDeliveries: defineTable({
		phoneNumber: v.string(), // E.164
		channel: v.optional(otpChannelId), // unset when rate limited before any channel was tried
		status: otpDeliveryStatus,
		providerMessageId: v.optional(v.string()),
		error: v.optional(v.string())
	}).index('by_phoneNumber', ['phoneNumber'])
});

export default schema;
