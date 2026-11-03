/**
 * OTP settings. Env vars are set on the Convex deployment (`npx convex env set ...`), not in
 * `.env.local`. The full list is in docs/06-phone-otp.md.
 */
import { AUTH_CONSTANTS } from '../auth.constants';
import type { OtpChannelId } from './types';

const BRAND_NAME = (AUTH_CONSTANTS.brandName ?? 'My App').trim();

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_IN_SECONDS = 5 * 60;
export const OTP_ALLOWED_ATTEMPTS = 3;

const KNOWN_CHANNELS: OtpChannelId[] = ['textbee', 'whatsapp', 'fast2sms', 'console'];

/**
 * Delivery order from `OTP_CHANNELS`, e.g. `whatsapp,fast2sms,textbee`. The dispatcher tries each
 * configured channel in turn until one accepts the message. Defaults to textbee (phase 1).
 */
export function getChannelOrder(): OtpChannelId[] {
	const raw = process.env.OTP_CHANNELS ?? 'textbee';
	const ids = raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	for (const id of ids) {
		if (!KNOWN_CHANNELS.includes(id as OtpChannelId)) {
			throw new Error(`OTP_CHANNELS contains unknown channel "${id}"`);
		}
	}
	return ids as OtpChannelId[];
}

/** The text SMS channels send. Keep it identical to your DLT template once you register one (phase 3). */
export function renderOtpSms(code: string): string {
	const minutes = Math.round(OTP_EXPIRES_IN_SECONDS / 60);
	return `${code} is your ${BRAND_NAME} login code. It expires in ${minutes} minutes. Do not share it with anyone.`;
}

/**
 * Placeholder email for users who sign up with only a phone number. Better Auth requires an email
 * on every user; `.invalid` is reserved (RFC 2606), so nothing is ever delivered to it.
 */
export function phoneSignUpEmail(e164: string): string {
	return `${e164.replace('+', '')}@phone.invalid`;
}
