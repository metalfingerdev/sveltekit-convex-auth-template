<script lang="ts">
  import type { Snippet } from "svelte";
  import type {
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from "svelte/elements";

  // A button, or a link that looks like one when `href` is given
  let {
    variant = "plain",
    block = false,
    icon = false,
    large = false,
    href,
    children,
    ...rest
  }: {
    variant?: "plain" | "primary" | "accent" | "danger" | "success";
    block?: boolean;
    /** A square button holding just an icon or a symbol */
    icon?: boolean;
    /** Taller, for the main action of a screen */
    large?: boolean;
    href?: string;
    children: Snippet;
  } & HTMLButtonAttributes &
    HTMLAnchorAttributes = $props();
</script>

{#if href}
  <a
    {href}
    class="ui-button {variant}"
    class:block
    class:icon
    class:large
    {...rest}
  >
    {@render children()}
  </a>
{:else}
  <button
    type="button"
    class="ui-button {variant}"
    class:block
    class:icon
    class:large
    {...rest}
  >
    {@render children()}
  </button>
{/if}

<style lang="postcss">
  @reference 'src/app.css';

  .ui-button {
    --fill: var(--color-foreground);
    @apply edge edge-press inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 font-bold disabled:opacity-50;
  }
  .primary {
    --fill: var(--color-primary);
    @apply bg-primary text-foreground;
  }
  .accent {
    --fill: var(--color-secondary);
    @apply bg-secondary text-on-secondary;
  }
  .success {
    --fill: var(--color-success);
    @apply bg-success text-foreground;
  }
  .danger {
    --fill: var(--color-danger);
    @apply bg-danger text-foreground;
  }
  .block {
    @apply flex w-full;
  }
  .large {
    @apply min-h-12 text-lg;
  }
  .icon {
    @apply min-w-11 px-0 text-lg;
  }
</style>
