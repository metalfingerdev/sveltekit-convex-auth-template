/**
 * Phase 2: Truecaller sign-in. NOT IMPLEMENTED: this file pins down the contract so the rest of
 * the code can be built against it. Design and open questions: docs/06-phone-otp.md#phase-2.
 *
 * Unlike every channel in ./channels, Truecaller sends no code. The user taps "Continue with
 * Truecaller", approves in the Truecaller app, and Truecaller hands our server a token we
 * exchange for a profile whose phone number Truecaller has already verified. No OTP, no SMS cost.
 *
 * Planned flow (mobile web, Truecaller's web SDK):
 *   1. Client generates a `requestNonce` and opens the `truecallersdk://` deep link with our partner
 *      key and that nonce.
 *   2. Truecaller POSTs `{ requestId, accessToken, endpoint }` to our callback, an httpAction in
 *      convex/http.ts.
 *   3. The server fetches `endpoint` with `Authorization: Bearer <accessToken>`, but only after
 *      checking that `endpoint`'s host is Truecaller's (`assertTruecallerHost`), or a forged
 *      callback could make us trust any server.
 *   4. The verified phone number signs the user in through a small custom Better Auth plugin
 *      endpoint that reuses the phoneNumber plugin's user lookup / sign-up path, so a Truecaller
 *      user and an OTP user with the same number are the same account.
 *   5. The client, which polls by `requestNonce`, picks up the session.
 *
 * Android / iOS apps would use Truecaller's OAuth SDK instead (authorization code + PKCE); only
 * step 1-2 differ.
 *
 * Env (planned): TRUECALLER_APP_KEY (partner key), TRUECALLER_CLIENT_ID (OAuth)
 */

export type TruecallerProfile = {
	/** E.164, verified by Truecaller */
	phoneNumber: string;
	firstName?: string;
	lastName?: string;
	email?: string;
};

export function isTruecallerConfigured(): boolean {
	return Boolean(process.env.TRUECALLER_APP_KEY);
}

/** Exchanges a callback's access token for the user's verified profile. */
export async function fetchTruecallerProfile(_args: {
	accessToken: string;
	endpoint: string;
}): Promise<TruecallerProfile> {
	throw new Error('Truecaller sign-in is not implemented yet (phase 2)');
}
