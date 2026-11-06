<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { ITEM } from './select-item-scope.svelte';

	let { children }: { children?: Snippet } = $props();
	const scope = getContext<{ selected: boolean }>(ITEM);
</script>

{#if scope?.selected}<span class="mark">{@render children?.()}</span>{/if}

<style lang="postcss">
	@reference 'src/app.css';

	.mark {
		@apply text-primary;
	}
</style>
