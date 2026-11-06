<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let { open = $bindable(false), children }: { open?: boolean; children?: Snippet } = $props();
</script>

<DropdownMenu.Root bind:open>
	{@render children?.()}
</DropdownMenu.Root>
