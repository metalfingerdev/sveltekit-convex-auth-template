<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	// Icons
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	toastOptions={{
		unstyled: true,
		classes: {
			toast: 'ui-toast',
			title: 'ui-toast-title',
			description: 'ui-toast-text',
			action: '',
			actionButton: '',
			cancelButton: '',
			closeButton: 'ui-toast-close',
			default: '',
			info: '',
			success: 'ui-toast-success',
			error: 'ui-toast-error',
			loading: '',
			warning: 'ui-toast-warning'
		}
	}}
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="flex-shrink-0 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="flex-shrink-0 text-success" />
	{/snippet}
	{#snippet errorIcon()}
		<CircleXIcon class="flex-shrink-0 text-danger" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="flex-shrink-0" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangleIcon class="flex-shrink-0 text-warning" />
	{/snippet}
</Sonner>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.sonner-loader) {
		position: static !important;
		transform: none !important;
	}
	/* A toast is a small raised card; success and error get a coloured edge */
	:global(.ui-toast) {
		--fill: var(--color-foreground);
		@apply edge pointer-events-auto flex w-full items-start gap-2 rounded-xl bg-foreground p-3 font-semibold text-text md:w-96;
	}
	:global(.ui-toast-success) {
		--fill: var(--color-success);
		@apply bg-success-tint;
	}
	:global(.ui-toast-error) {
		--fill: var(--color-danger);
		@apply bg-danger-tint;
	}
	:global(.ui-toast-warning) {
		--fill: var(--color-secondary);
		@apply bg-secondary-tint;
	}
	:global(.ui-toast-title) {
		@apply text-sm leading-tight font-bold break-words;
	}
	:global(.ui-toast-text) {
		@apply mt-1 line-clamp-2 text-xs text-text-muted;
	}
	:global(.ui-toast-close) {
		@apply order-last ml-auto p-1 text-xs;
	}
</style>
