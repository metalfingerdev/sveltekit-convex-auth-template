<script lang="ts">
  import type { Snippet } from "svelte";

  // A radio drawn as a tappable card (a plan, an address) or, with `pill`, as a small pill
  // (a short either/or choice). The native radio is kept, so keyboards and tests work as usual.
  let {
    name,
    value,
    checked,
    onchange,
    pill = false,
    children,
  }: {
    name: string;
    value: string;
    checked: boolean;
    onchange: () => void;
    pill?: boolean;
    children: Snippet;
  } = $props();
</script>

<label class="choice" class:pill class:on={checked}>
  <input type="radio" {name} {value} {checked} {onchange} />
  <span class="body">{@render children()}</span>
</label>

<style lang="postcss">
  @reference 'src/app.css';

  .choice {
    --fill: var(--color-foreground);
    @apply edge-flat relative flex min-h-11 cursor-pointer items-start gap-3 rounded-container bg-foreground p-3;
  }
  .on {
    --fill: var(--color-primary);
    @apply bg-primary-tint outline-2 outline-primary;
  }
  /* The real radio is visible in the card style, hidden in the pill style */
  .choice input {
    @apply mt-1 size-5 shrink-0 text-primary;
  }
  .body {
    @apply flex min-w-0 flex-col;
  }
  .pill {
    @apply items-center justify-center rounded-full px-4 py-2 font-bold;
  }
  .pill input {
    @apply sr-only;
  }
  .pill.on {
    @apply bg-primary text-foreground;
  }
</style>
