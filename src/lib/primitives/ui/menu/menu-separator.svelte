<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof DropdownMenu.Separator> = $props();
</script>

<DropdownMenu.Separator bind:ref class={cn('ui-menu-line', className)} {...restProps} />

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-menu-line) {
		@apply my-1 h-0.5 bg-border-muted;
	}
</style>
