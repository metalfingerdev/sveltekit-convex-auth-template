<script lang="ts">
  import { Select } from "bits-ui";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

  type Option = { value: string; label: string };

  let {
    value = $bindable(),
    options,
    label,
  }: { value: string; options: Option[]; label: string } = $props();

  const selected = $derived(options.find((option) => option.value === value));
</script>

<Select.Root type="single" bind:value items={options}>
  <Select.Trigger class="ui-select-trigger" aria-label={label}>
    <span>{selected?.label ?? label}</span>
    <ChevronDownIcon class="size-4" aria-hidden="true" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content class="ui-select-menu" sideOffset={6} align="start">
      <Select.Viewport>
        {#each options as option (option.value)}
          <Select.Item value={option.value} label={option.label} class="ui-select-option">
            {#snippet children({ selected })}
              <span>{option.label}</span>
              {#if selected}<CheckIcon class="size-4" aria-hidden="true" />{/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>

<style lang="postcss">
  @reference 'src/app.css';

  /* Bits renders these elements itself, so they are styled with :global */
  :global(.ui-select-trigger) {
    --fill: var(--color-foreground);
    @apply edge edge-press inline-flex min-h-11 items-center justify-between gap-2 rounded-base bg-foreground px-3 font-bold;
  }
  :global(.ui-select-menu) {
    --fill: var(--color-foreground);
    @apply edge z-30 min-w-44 rounded-container bg-foreground p-1;
  }
  :global(.ui-select-option) {
    @apply flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-base px-3 font-semibold;
  }
  :global(.ui-select-option[data-highlighted]) {
    @apply bg-midground;
  }
  :global(.ui-select-option[data-selected]) {
    @apply text-primary;
  }
</style>
