<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} class={cn('ui-dialog-header', className)} {...restProps}>
	{@render children?.()}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-dialog-header) {
		@apply flex flex-col gap-2 text-left;
	}
</style>
