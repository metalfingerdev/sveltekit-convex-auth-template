<script lang="ts">
	import { Popover } from 'bits-ui';
	import { getContext, type ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';
	import { PLACEMENT } from './popover-root.svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof Popover.Content> = $props();

	const placement = getContext<() => string>(PLACEMENT)?.() ?? 'bottom';
	const [side, align] = placement.split('-') as [
		'top' | 'bottom' | 'left' | 'right',
		'start' | 'end' | undefined
	];
</script>

<Popover.Portal>
	<Popover.Content
		bind:ref
		{side}
		align={align ?? 'center'}
		sideOffset={8}
		class={cn('ui-popover', className)}
		{...restProps}
	>
		{@render children?.()}
	</Popover.Content>
</Popover.Portal>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-popover) {
		--fill: var(--color-foreground);
		@apply edge z-50 w-80 max-w-[90svw] rounded-xl bg-foreground p-1 text-text outline-hidden;
	}
</style>
