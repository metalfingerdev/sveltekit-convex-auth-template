/**
 * Phone number helpers. Pure functions with no Convex imports, so the frontend can use them too
 * (`import { normalizeIndianMobile } from '#convex/otp/phone.js'`).
 *
 * Every number stored on a user and sent to a provider is canonical E.164 (`+91XXXXXXXXXX`). The
 * client normalizes before calling Better Auth, and the server validator rejects anything else, so
 * "98765 43210" and "+91-9876543210" can never become two different accounts.
 */

/** Indian mobile numbers: 10 digits starting 6-9. */
const INDIAN_MOBILE_E164 = /^\+91[6-9]\d{9}$/;

/**
 * Turns common ways of typing an Indian mobile number into E.164, or returns null.
 * Accepts `9876543210`, `09876543210`, `919876543210`, `+91 98765-43210`.
 */
export function normalizeIndianMobile(input: string): string | null {
	let digits = input.replace(/[\s\-().]/g, '');
	if (digits.startsWith('+')) digits = digits.slice(1);
	else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
	if (!/^\d+$/.test(digits)) return null;
	if (digits.length === 10) digits = `91${digits}`;
	const e164 = `+${digits}`;
	return INDIAN_MOBILE_E164.test(e164) ? e164 : null;
}

/** Server-side validator: only canonical E.164 Indian mobiles are accepted. */
export function isValidIndianMobile(phoneNumber: string): boolean {
	return INDIAN_MOBILE_E164.test(phoneNumber);
}

/** The 10-digit national number, which Indian providers like Fast2SMS expect. */
export function toIndianNationalNumber(e164: string): string {
	return e164.replace(/^\+91/, '');
}

/** `+91******3210`, for logs. */
export function maskPhone(e164: string): string {
	return e164.length > 7 ? `${e164.slice(0, 3)}******${e164.slice(-4)}` : '***';
}
