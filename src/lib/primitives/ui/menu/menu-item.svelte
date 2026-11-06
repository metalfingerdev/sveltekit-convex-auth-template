<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	// `value` is accepted for compatibility with the old Ark menu and not needed here
	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		value: _value,
		children,
		...restProps
	}: ComponentProps<typeof DropdownMenu.Item> & {
		variant?: 'default' | 'destructive';
		value?: string;
	} = $props();
</script>

<DropdownMenu.Item
	bind:ref
	data-variant={variant}
	class={cn('ui-menu-item', className)}
	{...restProps}
>
	{@render children?.()}
</DropdownMenu.Item>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-menu-item) {
		@apply flex min-h-10 cursor-pointer items-center gap-2 rounded-base px-2 text-sm font-semibold outline-none select-none;
	}
	:global(.ui-menu-item[data-highlighted]) {
		@apply bg-midground;
	}
	:global(.ui-menu-item[data-variant='destructive']) {
		@apply text-danger;
	}
	:global(.ui-menu-item[data-disabled]) {
		@apply pointer-events-none opacity-50;
	}
</style>
