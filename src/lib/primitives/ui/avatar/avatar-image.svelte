<script lang="ts">
	import { Avatar } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { class: className, ...restProps }: ComponentProps<typeof Avatar.Image> = $props();
</script>

<Avatar.Image class={cn('aspect-square size-full', className)} {...restProps} />
