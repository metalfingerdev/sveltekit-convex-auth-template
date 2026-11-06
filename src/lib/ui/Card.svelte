<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  // `as="a"` (with an href) makes a whole card a link; `pressable` adds the press feedback;
  // `dense` is the calmer, tighter look used all day in admin (flat edge, less padding)
  let {
    as = "div",
    pressable = false,
    dense = false,
    children,
    ...rest
  }: {
    as?: "div" | "a" | "li" | "section" | "article";
    pressable?: boolean;
    dense?: boolean;
    href?: string;
    children: Snippet;
  } & HTMLAttributes<HTMLElement> = $props();
</script>

<svelte:element
  this={as}
  class="ui-card"
  class:pressable
  class:dense
  {...rest}
>
  {@render children()}
</svelte:element>

<style lang="postcss">
  @reference 'src/app.css';

  .ui-card {
    --fill: var(--color-foreground);
    @apply edge block rounded-container bg-foreground p-3;
  }
  .dense {
    @apply edge-flat rounded-base p-2.5;
    box-shadow: none;
  }
  .pressable {
    @apply edge-press;
  }
</style>
