<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	// Same props as the old Ark-based dialog: `onOpenChange` gets `{ open }`, and `lazyMount` and
	// `unmountOnExit` are accepted but not needed (Bits only mounts the content while it is open).
	let {
		open = $bindable(false),
		onOpenChange,
		children
	}: {
		open?: boolean;
		onOpenChange?: (details: { open: boolean }) => void;
		lazyMount?: boolean;
		unmountOnExit?: boolean;
		children?: Snippet;
	} = $props();
</script>

<Dialog.Root bind:open onOpenChange={(next) => onOpenChange?.({ open: next })}>
	{@render children?.()}
</Dialog.Root>
