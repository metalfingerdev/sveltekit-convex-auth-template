/**
 * Settings for the end-to-end tests, read from `.env.local` (gitignored). See docs/09-testing.md.
 *
 * The tests create accounts and change data, so they refuse to run unless both the CLI
 * (`CONVEX_DEPLOYMENT`, used to read OTP codes) and the site (`PUBLIC_CONVEX_URL`) point at the
 * same **dev** deployment. Staging and production are never touched.
 */
import { existsSync } from 'node:fs';

try {
	process.loadEnvFile('.env.local');
} catch {
	// No file: the variables may come from the shell
}

export function assertDevDeployment() {
	const deployment = process.env.CONVEX_DEPLOYMENT?.split('#')[0].trim() ?? '';
	const [kind, name] = deployment.split(':');
	const siteHost = URL.canParse(process.env.PUBLIC_CONVEX_URL ?? '')
		? new URL(process.env.PUBLIC_CONVEX_URL!).hostname
		: '';
	if (kind !== 'dev' || !name) {
		throw new Error(
			`E2E tests only run against a dev deployment, but CONVEX_DEPLOYMENT is "${deployment || 'unset'}".`
		);
	}
	if (siteHost.split('.')[0] !== name) {
		throw new Error(
			`PUBLIC_CONVEX_URL (${siteHost || 'unset'}) is not the dev deployment ${name}; refusing to run.`
		);
	}
}

export type Role = 'user' | 'admin';

/** The test account's phone for a role, from E2E_USER_PHONE / E2E_ADMIN_PHONE */
export const phoneFor = (role: Role) => process.env[`E2E_${role.toUpperCase()}_PHONE`]?.trim() || null;

/** Where a role's signed-in browser state is kept between runs (gitignored) */
export const statePath = (role: Role) => `tests/e2e/.auth/${role}.json`;

export const hasRole = (role: Role) => phoneFor(role) !== null;

export const hasSavedState = (role: Role) => existsSync(statePath(role));

export const skipReason = (role: Role) =>
	`E2E_${role.toUpperCase()}_PHONE is not set in .env.local (docs/09-testing.md)`;
