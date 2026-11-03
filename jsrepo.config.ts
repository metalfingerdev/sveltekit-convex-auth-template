import { defineConfig } from 'jsrepo';

export default defineConfig({
    // configure where stuff comes from here
    registries: ['@auth/svelte'],
    // configure where stuff goes here
    paths: {
		base: './',
		convex: './src/convex',
		lib: './src/lib',
		routes: './src/routes',
		themes: './src/themes'
	},
});