/**
 * Development channel: prints the code to the Convex logs (`npx convex logs` or the dashboard)
 * instead of sending it. Refuses to run on a production deployment.
 *
 * Use `OTP_CHANNELS=console` on your dev deployment to sign in without spending SMS credits.
 */
import { maskPhone } from '../phone';
import type { OtpChannel } from '../types';

export const consoleChannel: OtpChannel = {
	id: 'console',
	kind: 'log',

	isConfigured() {
		// Set OTP_ALLOW_CONSOLE=true on dev only. Never set it on prod: anyone with log access could sign in as anyone.
		return process.env.OTP_ALLOW_CONSOLE === 'true';
	},

	async send({ to, code }) {
		console.log(`[otp:console] code for ${maskPhone(to)}: ${code}`);
		return { ok: true };
	}
};
