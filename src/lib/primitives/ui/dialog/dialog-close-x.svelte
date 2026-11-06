<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { XIcon } from '@lucide/svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Dialog.Close> = $props();
</script>

<Dialog.Close bind:ref class="ui-dialog-x" {...restProps}>
	<XIcon class="size-5" aria-hidden="true" />
	<span class="sr-only">Close</span>
</Dialog.Close>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-dialog-x) {
		@apply absolute top-3 right-3 grid size-11 place-items-center rounded-base;
	}
	:global(.ui-dialog-x:hover) {
		@apply bg-midground;
	}
</style>
