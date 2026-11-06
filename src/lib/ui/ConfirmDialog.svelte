<script lang="ts">
  import { AlertDialog } from "bits-ui";

  // Asks "are you sure?" before something that cannot be undone. Replaces the browser's confirm().
  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel,
    cancelLabel,
    onconfirm,
  }: {
    open?: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    onconfirm: () => void;
  } = $props();
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="ui-confirm-overlay" />
    <AlertDialog.Content class="ui-confirm">
      <AlertDialog.Title class="ui-confirm-title">{title}</AlertDialog.Title>
      {#if description}
        <AlertDialog.Description class="ui-confirm-text">
          {description}
        </AlertDialog.Description>
      {/if}
      <div class="ui-confirm-actions">
        <AlertDialog.Cancel class="ui-confirm-keep">{cancelLabel}</AlertDialog.Cancel>
        <AlertDialog.Action class="ui-confirm-go" onclick={onconfirm}>
          {confirmLabel}
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

<style lang="postcss">
  @reference 'src/app.css';

  /* Bits renders these elements itself, so they are styled with :global */
  :global(.ui-confirm-overlay) {
    @apply fixed inset-0 z-40 bg-black/45;
  }
  :global(.ui-confirm) {
    --fill: var(--color-foreground);
    @apply edge fixed top-1/2 left-1/2 z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-xl bg-foreground p-4 text-text;
  }
  :global(.ui-confirm-title) {
    @apply text-lg font-extrabold;
  }
  :global(.ui-confirm-text) {
    @apply text-sm text-text-muted;
  }
  :global(.ui-confirm-actions) {
    @apply flex flex-col-reverse gap-2 sm:flex-row sm:justify-end;
  }
  :global(.ui-confirm-keep),
  :global(.ui-confirm-go) {
    @apply edge edge-press inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-bold;
    --fill: var(--color-foreground);
    @apply bg-foreground;
  }
  :global(.ui-confirm-go) {
    --fill: var(--color-danger);
    @apply bg-danger text-foreground;
  }
</style>
