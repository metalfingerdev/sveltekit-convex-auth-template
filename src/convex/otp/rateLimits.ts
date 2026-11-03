/**
 * Limits on OTP sends. Every send costs money, and OTP endpoints are a classic target for SMS
 * pumping (bots requesting codes to premium numbers) and for harassing someone by flooding their
 * phone. Better Auth's own rate limiting doesn't apply inside Convex, so these are the real guard.
 */
import { HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';

export const otpRateLimiter = new RateLimiter(components.rateLimiter, {
	// One phone: 3 codes per 10 minutes, then roughly one more every 3 minutes
	otpPerPhone: { kind: 'token bucket', rate: 3, period: 10 * MINUTE, capacity: 3 },
	// Whole app: a spend ceiling. Raise it as real traffic grows
	otpGlobal: { kind: 'token bucket', rate: 500, period: HOUR, shards: 4 }
});
