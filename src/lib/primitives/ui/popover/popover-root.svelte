<script lang="ts" module>
	/** The Ark-style `positioning.placement` ("bottom", "bottom-end", ...) the content reads */
	export const PLACEMENT = Symbol('popover-placement');
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { setContext, type Snippet } from 'svelte';

	let {
		open = $bindable(false),
		positioning,
		children
	}: {
		open?: boolean;
		positioning?: { placement?: string };
		children?: Snippet;
	} = $props();

	setContext(PLACEMENT, () => positioning?.placement ?? 'bottom');
</script>

<Popover.Root bind:open>
	{@render children?.()}
</Popover.Root>
