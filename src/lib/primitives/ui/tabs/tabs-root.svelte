<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '../../utils.js';

	// Same props as the old Ark tabs: `onValueChange` gets `{ value }`
	let {
		ref = $bindable(null),
		value = $bindable<string | undefined>(),
		onValueChange,
		orientation = 'horizontal',
		class: className,
		children
	}: {
		ref?: HTMLElement | null;
		value?: string;
		onValueChange?: (details: { value: string }) => void;
		orientation?: 'horizontal' | 'vertical';
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<Tabs.Root
	bind:ref
	bind:value
	{orientation}
	onValueChange={(next) => onValueChange?.({ value: next })}
	class={cn('ui-tabs', className)}
>
	{@render children?.()}
</Tabs.Root>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-tabs) {
		@apply flex flex-col;
	}
	:global(.ui-tabs[data-orientation='vertical']) {
		@apply w-full shrink-0 flex-row items-start;
	}
</style>
