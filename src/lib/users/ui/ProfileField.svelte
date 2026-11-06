<script lang="ts">
  import type { Snippet } from "svelte";

  // One row of the profile dialog: a label, the current value, and a pencil (or plus) that turns
  // the row into its edit form. The whole row is the button while it is not being edited.
  let {
    label,
    editing,
    editLabel,
    onedit,
    icon,
    view,
    edit,
  }: {
    label: string;
    editing: boolean;
    /** Screen reader name of the button that starts editing */
    editLabel: string;
    onedit: () => void;
    /** The pencil or plus drawn on the right */
    icon: Snippet;
    view: Snippet;
    edit: Snippet;
  } = $props();
</script>

<div class="row" class:idle={!editing}>
  <div class="body">
    <span class="caption">{label}</span>
    {#if editing}
      {@render edit()}
    {:else}
      <div class="value">{@render view()}</div>
    {/if}
  </div>
  {#if !editing}
    <span class="mark" aria-hidden="true">{@render icon()}</span>
    <button class="cover" type="button" aria-label={editLabel} onclick={onedit}
    ></button>
  {/if}
</div>

<style lang="postcss">
  @reference 'src/app.css';

  .row {
    --fill: var(--color-midground);
    @apply edge-flat relative flex w-full items-center gap-3 rounded-xl bg-midground px-3.5 py-2.5;
  }
  .idle:hover {
    --fill: var(--color-background);
    @apply bg-background;
  }
  .body {
    @apply flex min-w-0 flex-1 flex-col gap-1;
  }
  .caption {
    @apply text-xs text-text-muted;
  }
  .value {
    @apply flex min-w-0 items-center gap-2 text-sm;
  }
  .mark {
    @apply grid size-8 shrink-0 place-items-center text-text-muted;
  }
  .cover {
    @apply absolute inset-0 size-full rounded-xl;
  }
  .cover:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary;
  }
</style>
