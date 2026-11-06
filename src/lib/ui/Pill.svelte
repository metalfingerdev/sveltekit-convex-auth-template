<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    tone = "plain",
    children,
  }: { tone?: "plain" | "ok" | "warn" | "bad"; children: Snippet } = $props();
</script>

<span class="pill {tone}">{@render children()}</span>

<style lang="postcss">
  @reference 'src/app.css';

  .pill {
    --fill: var(--color-foreground);
    @apply edge-flat inline-flex items-center rounded-full bg-foreground px-2 text-xs font-bold;
  }
  .ok {
    --fill: var(--color-success);
    @apply bg-success text-foreground;
  }
  .warn {
    --fill: var(--color-secondary);
    @apply bg-secondary text-on-secondary;
  }
  .bad {
    --fill: var(--color-danger);
    @apply bg-danger text-foreground;
  }
</style>
