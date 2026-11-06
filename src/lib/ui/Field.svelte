<script lang="ts">
  import type { Snippet } from "svelte";

  // A labelled form control. The control is whatever native input, select or textarea is passed
  // in: native pickers are best on cheap phones, and the tests drive them as they are.
  let {
    label,
    hint,
    hideLabel = false,
    error,
    errorId,
    children,
  }: {
    label: string;
    hint?: string;
    /** A message for this field; link the control to it with aria-describedby={errorId} */
    error?: string;
    errorId?: string;
    /** Keep the label for screen readers only, when a heading already says it */
    hideLabel?: boolean;
    children: Snippet;
  } = $props();
</script>

<div class="field">
  <label>
    <span class="caption" class:sr-only={hideLabel}>{label}</span>
    {@render children()}
  </label>
  {#if hint}<p class="hint">{hint}</p>{/if}
  {#if error}<p id={errorId} class="problem">{error}</p>{/if}
</div>

<style lang="postcss">
  @reference 'src/app.css';

  .field {
    @apply flex flex-col gap-1;
  }
  label {
    @apply flex flex-col gap-1;
  }
  .caption {
    @apply text-sm font-bold;
  }
  .hint {
    @apply text-xs text-text-muted;
  }
  .problem {
    @apply text-sm font-semibold text-danger;
  }
  .field :global(input:not([type="radio"], [type="checkbox"])),
  .field :global(select),
  .field :global(textarea) {
    --fill: var(--color-foreground);
    @apply edge-flat min-h-11 w-full rounded-lg bg-foreground px-3 py-2 text-text;
  }
  .field :global(textarea) {
    @apply min-h-20;
  }
  .field :global(input::placeholder),
  .field :global(textarea::placeholder) {
    @apply text-text-muted;
  }
  .field :global(:is(input, select, textarea):focus-visible) {
    @apply outline-2 outline-offset-2 outline-primary;
  }
</style>
