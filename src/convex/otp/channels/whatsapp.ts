/**
 * Phase 2: WhatsApp OTP via the Meta WhatsApp Cloud API. NOT YET TESTED against a live account.
 *
 * Sends an *authentication* template (Meta's template category for OTPs) with a copy-code button.
 * No SMS, no DLT. Most Indian users have WhatsApp, and authentication messages are billed per
 * message by Meta, typically cheaper than DLT SMS.
 *
 * Setup (Meta Business Manager -> WhatsApp -> Message templates):
 *   1. Create an "Authentication" template, e.g. `login_otp`, language `en`, with a "Copy code" button.
 *   2. Wait for approval, then set the env vars below.
 *
 * Env:
 *   WHATSAPP_ACCESS_TOKEN     required; a System User permanent token with whatsapp_business_messaging
 *   WHATSAPP_PHONE_NUMBER_ID  required; the sender's phone number id (not the number itself)
 *   WHATSAPP_OTP_TEMPLATE     optional, default `login_otp`
 *   WHATSAPP_OTP_LANGUAGE     optional, default `en`
 *   WHATSAPP_GRAPH_VERSION    optional, default `v21.0`
 */
import type { OtpChannel } from '../types';

type GraphResponse = {
	messages?: { id: string }[];
	error?: { message: string; code: number };
};

export const whatsapp: OtpChannel = {
	id: 'whatsapp',
	kind: 'whatsapp',

	isConfigured() {
		return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
	},

	async send({ to, code }) {
		const version = process.env.WHATSAPP_GRAPH_VERSION ?? 'v21.0';
		const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
				},
				body: JSON.stringify({
					messaging_product: 'whatsapp',
					to: to.replace('+', ''),
					type: 'template',
					template: {
						name: process.env.WHATSAPP_OTP_TEMPLATE ?? 'login_otp',
						language: { code: process.env.WHATSAPP_OTP_LANGUAGE ?? 'en' },
						components: [
							{ type: 'body', parameters: [{ type: 'text', text: code }] },
							// The copy-code button takes the code as its URL parameter
							{
								type: 'button',
								sub_type: 'url',
								index: '0',
								parameters: [{ type: 'text', text: code }]
							}
						]
					}
				})
			});
		} catch (error) {
			return { ok: false, error: `whatsapp network error: ${String(error)}`, retryable: true };
		}

		const body = (await response.json().catch(() => ({}))) as GraphResponse;
		if (!response.ok || !body.messages?.[0]?.id) {
			return {
				ok: false,
				error: `whatsapp HTTP ${response.status}: ${body.error?.message ?? 'unknown error'} (code ${body.error?.code ?? '?'})`,
				// Always fall through to the next channel: SMS reaches users WhatsApp can't
				// (e.g. 131026, the number isn't on WhatsApp)
				retryable: true
			};
		}
		return { ok: true, providerMessageId: body.messages[0].id };
	}
};
