/**
 * Runs before the specs (the `setup` project in playwright.config.ts): signs each test account in
 * once and keeps the session in tests/e2e/.auth/<role>.json, so later runs skip the OTP while it
 * stays valid.
 *
 * Sign-in uses the `console` OTP channel, which only the dev deployment has: the code is read from
 * `npx convex logs`, never sent by SMS.
 */
import { spawn } from 'node:child_process';
import { expect, test as setup, type Page } from '@playwright/test';
import { hasRole, hasSavedState, phoneFor, skipReason, statePath, type Role } from './env';

// A dev server on a cold Vite cache optimises dependencies during the first page loads and
// reloads server modules meanwhile, which can fail a render or two. Get that over with here.
setup('warm up the dev server', async ({ page }) => {
	for (const path of ['/', '/signin']) {
		let status = 0;
		for (let attempt = 0; attempt < 5 && status !== 200; attempt++) {
			status = (await page.goto(path))?.status() ?? 0;
			await page.waitForLoadState('networkidle');
		}
		expect(status, path).toBe(200);
	}
});

/** Streams the deployment's logs; `code` resolves with the console OTP for a number ending in `last4` */
const watchOtp = (last4: string) => {
	const logs = spawn('npx', ['convex', 'logs'], { stdio: ['ignore', 'pipe', 'pipe'] });
	// `convex logs` only shows lines from when it attached, so give it a moment first
	const attached = new Promise((resolve) => setTimeout(resolve, 5000));
	const code = new Promise<string>((resolve, reject) => {
		let buffer = '';
		const timer = setTimeout(() => {
			logs.kill();
			reject(new Error('No OTP in the dev logs. Is OTP_CHANNELS=console set on the dev deployment?'));
		}, 60_000);
		const read = (chunk: Buffer) => {
			buffer += chunk.toString();
			const match = new RegExp(`code for \\+91\\*+${last4}: (\\d{4,8})`).exec(buffer);
			if (match) {
				clearTimeout(timer);
				logs.kill();
				resolve(match[1]);
			}
		};
		logs.stdout.on('data', read);
		logs.stderr.on('data', read);
	});
	return { attached, code };
};

const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });

const isSignedIn = async (page: Page) => {
	await page.goto('/account');
	await page.waitForLoadState('networkidle');
	return new URL(page.url()).pathname === '/account';
};

const signIn = async (page: Page, phone: string) => {
	await page.goto('/signin');
	const main = page.getByRole('main');
	const submit = main.locator('form button[type=submit]');
	const otp = watchOtp(phone.slice(-4));
	await otp.attached;
	await main.locator('#phone').fill(phone.replace(/^\+91/, ''));
	await submit.click();
	await main.locator('#otp').fill(await otp.code);
	await submit.click();
	// A brand-new account is asked for its name once
	const name = main.locator('#name');
	await expect(name.or(accountMenu(page))).toBeVisible({ timeout: 30_000 });
	if (await name.isVisible()) {
		await name.fill('E2E Test');
		await submit.click();
	}
	await expect(accountMenu(page)).toBeVisible({ timeout: 30_000 });
};

for (const role of ['user', 'admin'] as const satisfies Role[]) {
	setup(`sign in as ${role}`, async ({ browser }) => {
		setup.skip(!hasRole(role), skipReason(role));
		const context = await browser.newContext(hasSavedState(role) ? { storageState: statePath(role) } : {});
		const page = await context.newPage();
		if (!(await isSignedIn(page))) await signIn(page, phoneFor(role)!);
		await context.storageState({ path: statePath(role) });
		await context.close();
	});
}
