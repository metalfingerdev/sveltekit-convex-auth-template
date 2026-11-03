/**
 * Limits on verification emails. Anyone can trigger one (sign-up, signing in unverified, the
 * "Resend email" button), so without these a bot could flood a stranger's inbox or burn through
 * the Resend quota. Better Auth's own rate limiting doesn't apply inside Convex.
 */
import { HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter';
import { components } from '../../_generated/api';

export const emailRateLimiter = new RateLimiter(components.rateLimiter, {
	// One address: 3 emails per 10 minutes, then roughly one more every 3 minutes
	verificationPerEmail: { kind: 'token bucket', rate: 3, period: 10 * MINUTE, capacity: 3 },
	// Whole app: a ceiling well under Resend's daily quota. Raise it as real traffic grows
	verificationGlobal: { kind: 'token bucket', rate: 200, period: HOUR, shards: 4 }
});
