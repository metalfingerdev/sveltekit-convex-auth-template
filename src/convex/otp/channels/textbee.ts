/**
 * Phase 1: textbee.dev. Sends SMS through an Android phone running the textbee app, so messages go
 * out from that phone's SIM at normal retail SMS rates. Good for launch and low volume: no DLT
 * registration, no sender ID. Throughput and deliverability are bounded by one consumer SIM, and
 * carriers can throttle or block a SIM that sends a lot of near-identical messages.
 *
 * API: https://textbee.dev/docs (OpenAPI: https://textbee.dev/openapi.json)
 *
 * Env:
 *   TEXTBEE_API_KEY    required, from the textbee dashboard
 *   TEXTBEE_DEVICE_ID  optional; without it textbee uses the default / most recently seen device
 *   TEXTBEE_BASE_URL   optional, for a self-hosted textbee server (default https://api.textbee.dev)
 */
import { renderOtpSms } from '../config';
import type { OtpChannel } from '../types';

type TextbeeSendResponse = {
	data?: {
		success?: boolean;
		message?: string;
		smsBatchId?: string;
		successCount?: number;
		failureCount?: number;
		warning?: { code: string; message: string };
	};
	error?: string;
	message?: string;
};

export const textbee: OtpChannel = {
	id: 'textbee',
	kind: 'sms',

	isConfigured() {
		return Boolean(process.env.TEXTBEE_API_KEY);
	},

	async send({ to, code }) {
		const baseUrl = (process.env.TEXTBEE_BASE_URL ?? 'https://api.textbee.dev').replace(/\/$/, '');
		const deviceId = process.env.TEXTBEE_DEVICE_ID;

		let response: Response;
		try {
			response = await fetch(`${baseUrl}/api/v1/gateway/send-sms`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': process.env.TEXTBEE_API_KEY as string
				},
				body: JSON.stringify({
					recipients: [to],
					message: renderOtpSms(code),
					...(deviceId ? { deviceId } : {})
				})
			});
		} catch (error) {
			return { ok: false, error: `textbee network error: ${String(error)}`, retryable: true };
		}

		const body = (await response.json().catch(() => ({}))) as TextbeeSendResponse;
		if (!response.ok) {
			return {
				ok: false,
				error: `textbee HTTP ${response.status}: ${body.error ?? body.message ?? 'unknown error'}`,
				// 4xx other than rate limiting means our request or account is wrong; another channel may still work
				retryable: true
			};
		}

		const data = body.data ?? {};
		// Immediate dispatch reports counts; queued dispatch reports `success`
		const accepted = data.success === true || (data.successCount ?? 0) > 0;
		if (!accepted) {
			return {
				ok: false,
				error: `textbee rejected the message: ${data.message ?? 'no reason given'}`,
				retryable: true
			};
		}

		// Accepted is not delivered: the phone still has to be online and have SMS permission
		return { ok: true, providerMessageId: data.smsBatchId, warning: data.warning?.message };
	}
};
