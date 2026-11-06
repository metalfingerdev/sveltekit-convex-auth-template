<script lang="ts">
	import { Avatar } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let { class: className, ...restProps }: ComponentProps<typeof Avatar.Fallback> = $props();
</script>

<Avatar.Fallback class={cn('ui-avatar-fallback', className)} {...restProps} />

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-avatar-fallback) {
		@apply flex size-full items-center justify-center rounded-full bg-midground;
	}
</style>
