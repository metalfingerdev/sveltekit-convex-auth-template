import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CONVEX_URL: {
		description: 'Convex deployment URL (`*.convex.cloud`)',
		public: true,
		static: true
	},
	PUBLIC_CONVEX_SITE_URL: {
		description: 'Convex HTTP actions URL (`*.convex.site`) that serves the Better Auth routes',
		public: true,
		static: true
	},
	PUBLIC_APP_ENV: {
		description: 'Set to `staging` on the staging site to show a "Staging" badge. Leave unset in production',
		public: true,
		static: true,
		schema: (value) => value || undefined
	}
});
