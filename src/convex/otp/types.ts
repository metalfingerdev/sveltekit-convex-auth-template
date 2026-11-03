/**
 * Shared types for phone OTP delivery. See docs/06-phone-otp.md.
 *
 * Better Auth's `phoneNumber` plugin owns the OTP itself (generation, storage, expiry, attempts).
 * This module only owns *delivery*: getting a code Better Auth generated onto the user's phone.
 */

/** Every delivery channel the dispatcher knows about. Add new ones here and in `channels/index.ts`. */
export type OtpChannelId = 'textbee' | 'whatsapp' | 'fast2sms' | 'console';

export type OtpChannelKind = 'sms' | 'whatsapp' | 'log';

export type OtpMessage = {
	/** E.164, e.g. `+919876543210`. Already validated by `phone.ts`. */
	to: string;
	/** The raw code. Channels build their own text, since template-based ones (WhatsApp, DLT) need it alone. */
	code: string;
};

export type DeliveryResult =
	| { ok: true; providerMessageId?: string; warning?: string }
	| { ok: false; error: string; /** false when retrying on another channel is pointless (e.g. bad number) */ retryable: boolean };

export interface OtpChannel {
	id: OtpChannelId;
	kind: OtpChannelKind;
	/** True when the env vars this channel needs are set. Unconfigured channels are skipped. */
	isConfigured(): boolean;
	send(message: OtpMessage): Promise<DeliveryResult>;
}
