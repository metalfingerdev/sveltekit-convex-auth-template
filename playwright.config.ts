/**
 * End-to-end tests: real pages in Chromium against the **dev** Convex deployment. Run with
 * `pnpm test:e2e`; the dev server starts unless one is already running on :5173. Not part of CI,
 * which has no Convex backend. See docs/09-testing.md.
 */
import { defineConfig, devices } from '@playwright/test';
import { assertDevDeployment } from './tests/e2e/env';

assertDevDeployment();

export default defineConfig({
	testDir: 'tests/e2e',
	// The specs share one dev deployment, so they run one at a time
	workers: 1,
	fullyParallel: false,
	timeout: 90_000,
	expect: { timeout: 15_000 },
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'pnpm dev --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 120_000
	},
	projects: [
		{ name: 'setup', testMatch: /auth\.setup\.ts/ },
		// A mid-range Android phone: the screens are designed for one
		{ name: 'phone', use: { ...devices['Pixel 7'] }, dependencies: ['setup'] }
	]
});
