<!-- A small spinning ring for buttons that are waiting on the server. Use it only inside a button
  or a short wait; for loading content, draw the real component with `bone` placeholders. -->
<span class="spinner" aria-hidden="true"></span>

<style lang="postcss">
  @reference 'src/app.css';

  .spinner {
    @apply inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent;
  }
</style>
