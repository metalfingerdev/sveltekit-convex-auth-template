/**
 * Phase 3: Fast2SMS, a DLT-compliant Indian SMS gateway. NOT YET TESTED against a live account.
 *
 * In India, commercial SMS to Indian numbers must go through TRAI's DLT: you register as a
 * Principal Entity, get a 6-character sender ID (header), and register each message template.
 * Unregistered texts are dropped by the carrier. Once registered this is the reliable,
 * high-throughput path; textbee (one SIM) is not.
 *
 * Uses the `dlt` route of https://www.fast2sms.com/dev/bulkV2. Fast2SMS also has a quick `otp`
 * route ("Your OTP: {#var#}", no DLT setup, their branding); set FAST2SMS_ROUTE=otp to try it while
 * DLT approval is pending. Check https://docs.fast2sms.com for the current contract before going live.
 *
 * Env:
 *   FAST2SMS_API_KEY      required
 *   FAST2SMS_ROUTE        `dlt` (default) or `otp`
 *   FAST2SMS_SENDER_ID    required for `dlt`: your approved DLT header, e.g. `MYAPP`
 *   FAST2SMS_TEMPLATE_ID  required for `dlt`: the Fast2SMS message id of your approved OTP template,
 *                         whose single variable is the code
 */
import { toIndianNationalNumber } from '../phone';
import type { OtpChannel } from '../types';

type Fast2SmsResponse = {
	return?: boolean;
	request_id?: string;
	message?: string | string[];
	status_code?: number;
};

function route(): 'dlt' | 'otp' {
	return process.env.FAST2SMS_ROUTE === 'otp' ? 'otp' : 'dlt';
}

export const fast2sms: OtpChannel = {
	id: 'fast2sms',
	kind: 'sms',

	isConfigured() {
		if (!process.env.FAST2SMS_API_KEY) return false;
		if (route() === 'dlt') {
			return Boolean(process.env.FAST2SMS_SENDER_ID && process.env.FAST2SMS_TEMPLATE_ID);
		}
		return true;
	},

	async send({ to, code }) {
		const payload =
			route() === 'dlt'
				? {
						route: 'dlt',
						sender_id: process.env.FAST2SMS_SENDER_ID,
						message: process.env.FAST2SMS_TEMPLATE_ID,
						variables_values: code,
						numbers: toIndianNationalNumber(to),
						flash: 0
					}
				: { route: 'otp', variables_values: code, numbers: toIndianNationalNumber(to) };

		let response: Response;
		try {
			response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: process.env.FAST2SMS_API_KEY as string
				},
				body: JSON.stringify(payload)
			});
		} catch (error) {
			return { ok: false, error: `fast2sms network error: ${String(error)}`, retryable: true };
		}

		const body = (await response.json().catch(() => ({}))) as Fast2SmsResponse;
		if (!response.ok || body.return !== true) {
			const message = Array.isArray(body.message) ? body.message.join('; ') : body.message;
			return {
				ok: false,
				error: `fast2sms HTTP ${response.status}: ${message ?? 'unknown error'}`,
				retryable: true
			};
		}
		return { ok: true, providerMessageId: body.request_id };
	}
};
