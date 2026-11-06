<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Tabs.List> = $props();
</script>

<Tabs.List bind:ref class={cn('ui-tab-list', className)} {...restProps} />

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-tab-list) {
		@apply inline-flex w-fit items-center justify-center gap-1;
	}
	:global([data-orientation='vertical'] > .ui-tab-list) {
		@apply w-full flex-col items-start justify-start;
	}
</style>
