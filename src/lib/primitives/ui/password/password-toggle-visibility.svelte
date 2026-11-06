<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import { usePasswordToggleVisibility } from './password.svelte.js';
	import type { PasswordToggleVisibilityProps } from './types.js';
	import { cn } from '../../utils.js';

	let { ref = $bindable(null), class: className }: PasswordToggleVisibilityProps = $props();

	const state = usePasswordToggleVisibility();
	const hidden = $derived(state.root.opts.hidden.current);
</script>

<button
	bind:this={ref}
	type="button"
	class={cn('ui-eye', state.root.passwordState.copyMounted && 'with-copy', className)}
	aria-label={hidden ? 'Show password' : 'Hide password'}
	aria-pressed={!hidden}
	tabindex={-1}
	onclick={() => (state.root.opts.hidden.current = !hidden)}
>
	{#if hidden}
		<EyeIcon class="size-4" />
	{:else}
		<EyeOffIcon class="size-4" />
	{/if}
</button>

<style lang="postcss">
	@reference 'src/app.css';

	:global(.ui-eye) {
		@apply absolute top-1/2 right-0 grid size-9 -translate-y-1/2 place-items-center text-text-muted;
	}
	:global(.ui-eye:hover) {
		@apply text-text;
	}
	:global(.ui-eye.with-copy) {
		@apply right-9;
	}
</style>
