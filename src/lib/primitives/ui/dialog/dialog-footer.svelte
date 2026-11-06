<script lang="ts">
	import { cn, type WithElementRef } from '../../utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} class={cn('ui-dialog-footer', className)} {...restProps}>
	{@render children?.()}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-dialog-footer) {
		@apply flex justify-end gap-2 pt-4;
	}
</style>
