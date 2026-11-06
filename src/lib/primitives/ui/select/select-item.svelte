<script lang="ts">
	import { Select } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ItemScope from './select-item-scope.svelte';
	import type { SelectItem } from './select-root.svelte';

	let { item, children: content }: { item: SelectItem; children?: Snippet } = $props();
</script>

<Select.Item value={item.value} label={item.label} disabled={item.disabled} class="ui-select-item">
	{#snippet children({ selected }: { selected: boolean })}
		<ItemScope {selected}>{@render content?.()}</ItemScope>
	{/snippet}
</Select.Item>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-select-item) {
		@apply flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 text-sm font-semibold outline-none;
	}
	:global(.ui-select-item[data-highlighted]) {
		@apply bg-midground;
	}
	:global(.ui-select-item[data-disabled]) {
		@apply pointer-events-none opacity-50;
	}
</style>
