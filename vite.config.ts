import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),

			// Vercel in Mumbai (bom1), the closest region for most Indian users: change `regions` if
			// your customers are elsewhere. See https://svelte.dev/docs/kit/adapters for other targets.
			adapter: adapter({ regions: ['bom1'] })
		})
	]
});
