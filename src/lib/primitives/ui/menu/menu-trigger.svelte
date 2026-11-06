<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof DropdownMenu.Trigger> = $props();
</script>

<DropdownMenu.Trigger bind:ref {...restProps} />
