/**
 * Who may open what. The route check in hooks.server.ts and each page's client-side redirect are
 * UX; the Convex functions behind them are the security boundary. This proves the pages behave:
 * the home page is open, everything else sends a visitor to sign in and back, and a signed-in
 * user who is not an admin is refused the admin area.
 */
import { expect, test } from '@playwright/test';
import { AUTH_CONSTANTS } from '../../src/convex/auth.constants';
import { hasRole, skipReason, statePath } from './env';

const PRIVATE_PAGES = ['/account', '/account/profile', '/admin'];

test.describe('signed out', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('can open the home page and the sign-in page', async ({ page }) => {
		for (const path of ['/', '/signin']) {
			await page.goto(path);
			expect(new URL(page.url()).pathname, path).toBe(path);
		}
	});

	test('is sent to sign in, and back to the page afterwards', async ({ page }) => {
		for (const path of PRIVATE_PAGES) {
			await page.goto(path);
			await page.waitForURL(/\/signin/);
			expect(new URL(page.url()).searchParams.get('redirectTo'), path).toBe(path);
		}
	});
});

test.describe('signed-in user', () => {
	test.skip(!hasRole('user'), skipReason('user'));
	test.use({ storageState: statePath('user') });

	test('reaches their account and profile', async ({ page }) => {
		await page.goto('/account');
		await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
		await page.getByRole('link', { name: /Profile/ }).click();
		await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible();
	});

	test('is refused the admin area and is shown no admin link', async ({ page }) => {
		await page.goto('/admin');
		await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
		await page.goto('/');
		await page.getByRole('button', { name: 'Account menu' }).click();
		await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
	});
});

test.describe('admin', () => {
	test.skip(!hasRole('admin'), skipReason('admin'));
	test.skip(!AUTH_CONSTANTS.admin, 'the admin flag is off in src/convex/auth.constants.ts');
	test.use({ storageState: statePath('admin') });

	test('reaches the dashboard from the account menu', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Account menu' }).click();
		await page.getByRole('link', { name: 'Admin' }).click();
		await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();
	});
});
