<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	// A panel that slides in from an edge, built on the same Bits dialog as the centred one
	let {
		open = $bindable(false),
		onOpenChange,
		children
	}: {
		open?: boolean;
		onOpenChange?: (details: { open: boolean }) => void;
		children?: Snippet;
	} = $props();
</script>

<Dialog.Root bind:open onOpenChange={(next) => onOpenChange?.({ open: next })}>
	{@render children?.()}
</Dialog.Root>
