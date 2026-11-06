<script lang="ts">
  import { Switch } from "bits-ui";
  import type { Snippet } from "svelte";

  let {
    checked = $bindable(false),
    children,
  }: { checked?: boolean; children: Snippet } = $props();
</script>

<label class="switch">
  <Switch.Root bind:checked class="ui-switch-track">
    <Switch.Thumb class="ui-switch-thumb" />
  </Switch.Root>
  <span>{@render children()}</span>
</label>

<style lang="postcss">
  @reference 'src/app.css';

  .switch {
    @apply inline-flex min-h-11 items-center gap-2 font-semibold;
  }
  :global(.ui-switch-track) {
    --fill: var(--color-background);
    @apply edge-flat relative h-7 w-12 shrink-0 rounded-full bg-background transition-colors;
  }
  :global(.ui-switch-track[data-state="checked"]) {
    --fill: var(--color-primary);
    @apply bg-primary;
  }
  :global(.ui-switch-thumb) {
    @apply block size-5 translate-x-0.5 rounded-full bg-foreground shadow transition-transform;
  }
  :global(.ui-switch-thumb[data-state="checked"]) {
    @apply translate-x-5.5;
  }
</style>
