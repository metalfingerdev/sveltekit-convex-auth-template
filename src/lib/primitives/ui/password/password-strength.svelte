<script lang="ts">
	import { usePasswordStrength } from './password.svelte.js';
	import type { PasswordStrengthProps } from './types.js';
	import { cn } from '../../utils.js';
	import { PASSWORD_STRENGTH_LABEL } from '../../utils/passwordStrength.js';

	let { class: className }: PasswordStrengthProps = $props();

	const state = usePasswordStrength();
	const score = $derived(state.score);
</script>

<!-- A four-step meter: one bar per step, coloured by how strong the password is -->
<div
	class={cn('ui-meter', className)}
	role="progressbar"
	aria-label={PASSWORD_STRENGTH_LABEL}
	aria-valuemin={0}
	aria-valuemax={4}
	aria-valuenow={score}
	aria-valuetext={state.text}
>
	{#each [1, 2, 3, 4] as step (step)}
		<span class="bar" class:weak={score <= 1} class:fair={score === 2 || score === 3} class:strong={score === 4} class:on={score >= step}></span>
	{/each}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	.ui-meter {
		@apply flex h-1.5 w-full gap-1;
	}
	.bar {
		@apply h-full flex-1 rounded-full bg-background transition-colors duration-300;
	}
	.on.weak {
		@apply bg-danger;
	}
	.on.fair {
		@apply bg-warning;
	}
	.on.strong {
		@apply bg-success;
	}
</style>
