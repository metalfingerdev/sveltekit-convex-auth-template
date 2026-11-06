<script lang="ts">
	import { Select } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof Select.Content> = $props();
</script>

<Select.Portal>
	<Select.Content bind:ref sideOffset={6} class={cn('ui-select-content', className)} {...restProps}>
		<Select.Viewport>
			{@render children?.()}
		</Select.Viewport>
	</Select.Content>
</Select.Portal>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-select-content) {
		--fill: var(--color-foreground);
		@apply edge z-50 max-h-72 min-w-(--bits-select-anchor-width) overflow-y-auto rounded-xl bg-foreground p-1 text-text;
	}
</style>
