<script lang="ts">
  import { resolve } from "$app/paths";
  import Button from "#lib/ui/Button.svelte";
  import Card from "#lib/ui/Card.svelte";
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<div class="page">
  <Card>
    <h1 class="title">Welcome</h1>
    <p class="lead">
      This is the placeholder home page. Replace it in <code>src/routes/+page.svelte</code>
      and build your screens from <code>src/lib/ui</code>.
    </p>
    <div class="actions">
      <Button variant="primary" href={resolve("/account")}>Your account</Button>
    </div>
  </Card>
</div>

<style lang="postcss">
  @reference 'src/app.css';

  .page {
    @apply mx-auto flex w-full max-w-xl flex-col gap-3 p-4;
  }
  .title {
    @apply text-2xl font-extrabold;
  }
  .lead {
    @apply mt-2 text-text-muted;
  }
  .actions {
    @apply mt-4 flex gap-2;
  }
</style>
