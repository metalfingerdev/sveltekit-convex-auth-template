<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { Snippet } from "svelte";
  import XIcon from "@lucide/svelte/icons/x";

  // A box in the middle of the screen on a laptop, the whole screen on a phone. The content is
  // only mounted while it is open, so a form inside starts fresh every time.
  let {
    open = $bindable(false),
    title,
    closeLabel,
    children,
  }: {
    open?: boolean;
    title: string;
    closeLabel: string;
    children: Snippet;
  } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="ui-modal-overlay" />
    <Dialog.Content class="ui-modal">
      <Dialog.Title class="sr-only">{title}</Dialog.Title>
      <Dialog.Close class="ui-modal-close" aria-label={closeLabel}>
        <XIcon class="size-5" aria-hidden="true" />
      </Dialog.Close>
      <div class="ui-modal-body">{@render children()}</div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style lang="postcss">
  @reference 'src/app.css';

  /* Bits renders these elements itself, so they are styled with :global */
  :global(.ui-modal-overlay) {
    @apply fixed inset-0 z-40 bg-black/45;
  }
  :global(.ui-modal) {
    --fill: var(--color-foreground);
    @apply fixed inset-0 z-50 flex flex-col overflow-y-auto bg-foreground text-text;
  }
  :global(.ui-modal-close) {
    @apply absolute top-2 right-2 z-10 grid size-11 place-items-center rounded-base;
  }
  :global(.ui-modal-body) {
    @apply flex flex-1 flex-col justify-center p-2;
  }
  @media (min-width: 640px) {
    :global(.ui-modal) {
      @apply edge inset-auto top-1/2 left-1/2 max-h-[90dvh] w-[28rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-container;
    }
    :global(.ui-modal-body) {
      @apply p-6;
    }
  }
</style>
