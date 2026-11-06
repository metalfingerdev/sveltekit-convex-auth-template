<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Dialog.Title> = $props();
</script>

<Dialog.Title bind:ref class={cn('ui-dialog-title', className)} {...restProps} />
