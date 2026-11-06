<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Tabs.Content> = $props();
</script>

<Tabs.Content bind:ref class={cn('ui-tab-panel', className)} {...restProps} />

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-tab-panel) {
		@apply w-full outline-none;
	}
</style>
