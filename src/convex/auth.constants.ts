import type { AuthConstants } from './auth.constants.types';

export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		password: true,
		phoneOTP: true
	},
	// Email verification through Resend (docs/07-email-verification.md)
	sendEmails: true,
	brandName: 'My App'
};
