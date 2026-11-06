<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";

  import { AUTH_CONSTANTS } from "#convex/auth.constants.js";
  import { getAuthContext } from "#lib/auth/context.svelte.js";
  import { useRequireSignIn } from "#lib/auth/requireSignIn.svelte.js";
  import ProfileInfo from "#lib/users/ui/ProfileInfo.svelte";
  import Emails from "#lib/users/ui/Emails.svelte";
  import PhoneNumber from "#lib/users/ui/PhoneNumber.svelte";
  import Accounts from "#lib/users/ui/Accounts.svelte";
  import ApiKeys from "#lib/users/ui/ApiKeys.svelte";
  import DeleteUser from "#lib/users/ui/DeleteUser.svelte";

  useRequireSignIn();
  const { authConstants } = getAuthContext();
</script>

<svelte:head>
  <title>
    {AUTH_CONSTANTS.brandName ? `Profile | ${AUTH_CONSTANTS.brandName}` : "Profile"}
  </title>
</svelte:head>

<div class="page">
  <a class="back" href={resolve("/account")}>
    <ChevronLeftIcon class="size-5" aria-hidden="true" />
    Account
  </a>
  <h1 class="title">Profile</h1>

  <div class="fields">
    <ProfileInfo />
    <Emails />
    {#if authConstants.providers.phoneOTP}
      <PhoneNumber />
    {/if}
  </div>

  <Accounts />
  {#if authConstants.apiKeys}
    <ApiKeys />
  {/if}

  <section class="danger">
    <h2 class="section">Danger zone</h2>
    <DeleteUser />
  </section>
</div>

<style lang="postcss">
  @reference 'src/app.css';

  /* A readable width on a wide screen */
  .page {
    @apply mx-auto flex w-full max-w-xl flex-col gap-4 p-4;
  }
  .back {
    @apply -ml-1 inline-flex min-h-11 items-center gap-1 self-start font-semibold;
  }
  .title {
    @apply text-2xl font-extrabold;
  }
  .fields {
    @apply flex flex-col gap-3;
  }
  .section {
    @apply text-sm font-bold text-text-muted;
  }
  .danger {
    @apply flex flex-col items-start gap-2;
  }
</style>
