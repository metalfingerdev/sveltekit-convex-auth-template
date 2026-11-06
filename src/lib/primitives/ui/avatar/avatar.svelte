<script lang="ts">
	import { Avatar } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	// `onStatusChange` gets `{ status }` ("loading", "loaded", "error"), as the Ark avatar did
	let {
		class: className,
		onStatusChange,
		...restProps
	}: Omit<ComponentProps<typeof Avatar.Root>, 'onLoadingStatusChange'> & {
		onStatusChange?: (details: { status: 'loading' | 'loaded' | 'error' }) => void;
	} = $props();
</script>

<Avatar.Root
	class={cn('ui-avatar-root', className)}
	onLoadingStatusChange={(status) => onStatusChange?.({ status })}
	{...restProps}
/>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-avatar-root) {
		@apply relative flex size-8 shrink-0 overflow-hidden rounded-full;
	}
</style>
