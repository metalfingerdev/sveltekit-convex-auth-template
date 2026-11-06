<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn } from '../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof Dialog.Content> = $props();

	// A click on a toast must not count as a click outside, or it would close the dialog
	const keepOpenForToasts = (event: PointerEvent) => {
		if (event.target instanceof Element && event.target.closest('[data-sonner-toast]')) {
			event.preventDefault();
		}
	};
</script>

<Dialog.Portal>
	<Dialog.Overlay class="ui-dialog-overlay" />
	<Dialog.Content
		bind:ref
		class={cn('ui-dialog', className)}
		onInteractOutside={keepOpenForToasts}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Content>
</Dialog.Portal>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-dialog-overlay) {
		@apply fixed inset-0 z-50 bg-black/45;
	}
	:global(.ui-dialog) {
		--fill: var(--color-foreground);
		@apply edge fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-5 overflow-x-hidden overflow-y-auto rounded-container bg-foreground p-5 text-text;
	}
</style>
