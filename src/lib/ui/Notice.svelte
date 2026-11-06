<script lang="ts">
  import type { Snippet } from "svelte";

  // A message box: info (neutral), warn (gold), bad (red). `role` is passed by the caller:
  // "status" for things that are merely true, "alert" for things the user must act on.
  let {
    tone = "info",
    role,
    children,
  }: {
    tone?: "info" | "warn" | "bad";
    role?: "status" | "alert";
    children: Snippet;
  } = $props();
</script>

<div class="notice {tone}" {role}>{@render children()}</div>

<style lang="postcss">
  @reference 'src/app.css';

  .notice {
    --fill: var(--color-foreground);
    @apply edge-flat flex flex-col items-start gap-2 rounded-container bg-foreground p-3 text-sm;
  }
  .warn {
    --fill: var(--color-secondary);
    @apply bg-secondary-tint;
  }
  .bad {
    --fill: var(--color-danger);
    @apply bg-danger-tint;
  }
</style>
