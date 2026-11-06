<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Tabs.Trigger> = $props();
</script>

<Tabs.Trigger bind:ref class={cn('ui-tab', className)} {...restProps} />

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-tab) {
		@apply inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 font-bold whitespace-nowrap text-text-muted;
	}
	:global(.ui-tab:hover) {
		@apply bg-foreground text-text;
	}
	:global(.ui-tab[data-state='active']) {
		--fill: var(--color-primary);
		@apply bg-primary text-foreground;
	}
	:global(.ui-tab:disabled) {
		@apply pointer-events-none opacity-50;
	}
	:global([data-orientation='vertical'] .ui-tab) {
		@apply w-full justify-start text-left;
	}
</style>
