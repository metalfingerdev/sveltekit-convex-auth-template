<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Dialog.Trigger> = $props();
</script>

<Dialog.Trigger bind:ref {...restProps} />
