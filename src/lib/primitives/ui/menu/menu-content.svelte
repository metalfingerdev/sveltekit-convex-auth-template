<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof DropdownMenu.Content> = $props();
</script>

<DropdownMenu.Portal>
	<DropdownMenu.Content bind:ref align="end" sideOffset={6} class={cn('ui-menu', className)} {...restProps}>
		{@render children?.()}
	</DropdownMenu.Content>
</DropdownMenu.Portal>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-menu) {
		--fill: var(--color-foreground);
		@apply edge z-50 min-w-32 overflow-x-hidden overflow-y-auto rounded-xl bg-foreground p-1 text-text outline-none;
	}
</style>
