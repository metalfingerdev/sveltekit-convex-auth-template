import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionCtx } from '../_generated/server';
import type { DeliveryResult } from './types';

const PHONE = '+919876543210';

// Channels and the rate limiter are replaced, so these tests exercise only the dispatcher's own
// rules: which channel is tried, when it falls through, and when it gives up.
const fakes = vi.hoisted(() => {
	const channel = (id: string) => ({
		id,
		kind: 'sms',
		isConfigured: vi.fn(() => true),
		send: vi.fn(async (): Promise<DeliveryResult> => ({ ok: true, providerMessageId: `${id}-1` }))
	});
	return {
		whatsapp: channel('whatsapp'),
		textbee: channel('textbee'),
		limit: vi.fn(async (_ctx: unknown, _name: string, _opts?: unknown) => ({ ok: true }) as {
			ok: boolean;
			retryAfter?: number;
		})
	};
});

vi.mock('./channels', () => ({ CHANNELS: { whatsapp: fakes.whatsapp, textbee: fakes.textbee } }));
vi.mock('./rateLimits', () => ({ otpRateLimiter: { limit: fakes.limit } }));

const { sendOtp } = await import('./send');

const runMutation = vi.fn();
const ctx = { runMutation } as unknown as ActionCtx;
const send = () => sendOtp(ctx, { phoneNumber: PHONE, code: '123456' });
const recorded = () => runMutation.mock.calls.map(([, args]) => args);

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubEnv('OTP_CHANNELS', 'whatsapp,textbee');
	fakes.whatsapp.isConfigured.mockReturnValue(true);
	fakes.textbee.isConfigured.mockReturnValue(true);
	fakes.whatsapp.send.mockResolvedValue({ ok: true, providerMessageId: 'whatsapp-1' });
	fakes.textbee.send.mockResolvedValue({ ok: true, providerMessageId: 'textbee-1' });
	fakes.limit.mockResolvedValue({ ok: true });
});

describe('sendOtp', () => {
	it('uses the first channel that accepts the message and stops there', async () => {
		await expect(send()).resolves.toEqual({ channel: 'whatsapp' });
		expect(fakes.textbee.send).not.toHaveBeenCalled();
		expect(recorded()).toMatchObject([{ channel: 'whatsapp', status: 'sent' }]);
	});

	it('skips a channel that is not configured', async () => {
		fakes.whatsapp.isConfigured.mockReturnValue(false);
		await expect(send()).resolves.toEqual({ channel: 'textbee' });
		expect(fakes.whatsapp.send).not.toHaveBeenCalled();
	});

	it('tries the next channel after a failure that is worth retrying, and logs both', async () => {
		fakes.whatsapp.send.mockResolvedValue({ ok: false, error: 'timeout', retryable: true });
		await expect(send()).resolves.toEqual({ channel: 'textbee' });
		expect(recorded()).toMatchObject([
			{ channel: 'whatsapp', status: 'failed', error: 'timeout' },
			{ channel: 'textbee', status: 'sent' }
		]);
	});

	it('does not try other channels when the failure would repeat (a bad number)', async () => {
		fakes.whatsapp.send.mockResolvedValue({ ok: false, error: 'invalid number', retryable: false });
		await expect(send()).rejects.toMatchObject({ status: 'INTERNAL_SERVER_ERROR' });
		expect(fakes.textbee.send).not.toHaveBeenCalled();
	});

	it('fails loudly when no channel is configured, so nobody waits for a code that will not come', async () => {
		fakes.whatsapp.isConfigured.mockReturnValue(false);
		fakes.textbee.isConfigured.mockReturnValue(false);
		await expect(send()).rejects.toMatchObject({ status: 'INTERNAL_SERVER_ERROR' });
	});

	it('refuses before any channel is used when a rate limit is hit', async () => {
		fakes.limit.mockResolvedValue({ ok: false, retryAfter: 42_000 });
		await expect(send()).rejects.toMatchObject({
			status: 'TOO_MANY_REQUESTS',
			body: { message: expect.stringContaining('42 seconds') }
		});
		expect(fakes.whatsapp.send).not.toHaveBeenCalled();
		expect(recorded()).toMatchObject([{ status: 'rate_limited' }]);
	});

	it('does not spend the app-wide budget on a phone that is already limited', async () => {
		fakes.limit.mockResolvedValueOnce({ ok: false, retryAfter: 1000 });
		await expect(send()).rejects.toMatchObject({ status: 'TOO_MANY_REQUESTS' });
		expect(fakes.limit).toHaveBeenCalledTimes(1);
		expect(fakes.limit).toHaveBeenCalledWith(ctx, 'otpPerPhone', { key: PHONE });
	});

	it('refuses a number that is not a canonical Indian mobile before touching the limiter', async () => {
		await expect(sendOtp(ctx, { phoneNumber: '9876543210', code: '123456' })).rejects.toMatchObject({
			status: 'BAD_REQUEST'
		});
		expect(fakes.limit).not.toHaveBeenCalled();
	});
});
