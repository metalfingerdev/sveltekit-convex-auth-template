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
