<script lang="ts">
	import { Popover } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Popover.Trigger> = $props();
</script>

<Popover.Trigger bind:ref {...restProps} />
