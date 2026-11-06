<script lang="ts">
  import { resolve } from "$app/paths";
  import "../app.css";
  import favicon from "#lib/assets/favicon.svg";
  import { PUBLIC_APP_ENV } from "$app/env/public";
  import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { authClient } from "#lib/auth/api/auth-client.js";
  import { api } from "#convex/_generated/api.js";
  import { AUTH_CONSTANTS } from "#convex/auth.constants.js";

  import { Toaster } from "#lib/primitives/ui/sonner/index.js";
  import OrganizationSwitcher from "#lib/organizations/ui/OrganizationSwitcher.svelte";
  import UserButton from "#lib/users/ui/UserButton.svelte";
  import AuthProvider from "#lib/auth/ui/AuthProvider.svelte";
  import OrganizationProfileHost from "#lib/organizations/ui/OrganizationProfileHost.svelte";
  import ImpersonationBanner from "#lib/admin/ui/ImpersonationBanner.svelte";
  import Pill from "#lib/ui/Pill.svelte";

  let { children, data } = $props();

  createSvelteAuthClient({ authClient, getServerState: () => data.authState });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster position="top-center" />
<AuthProvider {api} {authClient} authConstants={AUTH_CONSTANTS}>
  <div class="shell">
    {#if AUTH_CONSTANTS.admin}
      <div class="print:hidden"><ImpersonationBanner /></div>
    {/if}
    <header class="header">
      <a href={resolve("/")} class="brand">{AUTH_CONSTANTS.brandName ?? "Home"}</a>
      {#if PUBLIC_APP_ENV === "staging"}
        <span title="This is the staging site, not production">
          <Pill tone="warn">Staging</Pill>
        </span>
      {/if}
      {#if AUTH_CONSTANTS.organizations}
        <OrganizationSwitcher initialData={data.initialData} />
      {/if}
      <UserButton initialData={data.initialData} />
    </header>
    <main>
      {@render children()}
    </main>
  </div>

  {#if AUTH_CONSTANTS.organizations}
    <OrganizationProfileHost initialData={data.initialData} />
  {/if}
</AuthProvider>

<style lang="postcss">
  @reference 'src/app.css';

  .shell {
    @apply flex min-h-dvh flex-col bg-midground text-text;
  }
  .header {
    @apply flex min-w-0 items-center justify-between gap-2 border-b-2 border-border-muted bg-foreground p-3 sm:gap-5 sm:p-4;
  }
  .brand {
    @apply mr-auto min-w-0 truncate text-xl font-extrabold text-primary sm:text-2xl;
  }
</style>
