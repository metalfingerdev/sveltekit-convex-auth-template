<script lang="ts">
  import { resolve } from "$app/paths";
  import { refreshAll } from "$app/navigation";
  import { Popover, Avatar } from "bits-ui";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { useQuery } from "convex-svelte";
  import type { Snippet } from "svelte";

  import { getAuthContext } from "#lib/auth/context.svelte.js";
  import type { GetActiveUserType } from "#lib/auth/types.js";
  import SignIn from "#lib/auth/ui/SignIn.svelte";
  import { useIsAppAdmin } from "#lib/admin/api/admin.svelte.js";
  import { ADMIN_ROUTE } from "#lib/admin/utils/admin.constants.js";
  import Button from "#lib/ui/Button.svelte";
  import Modal from "#lib/ui/Modal.svelte";

  // The signed-in user's menu, or a Sign in button. The name opens the account page.
  let {
    initialData,
    signInTrigger,
  }: {
    initialData?: { activeUser?: GetActiveUserType };
    /** Replaces the default Sign in button. `open` launches the sign-in modal. */
    signInTrigger?: Snippet<[{ open: () => void }]>;
  } = $props();

  const auth = useAuth();
  const { api, authClient, authConstants } = getAuthContext();
  const admin = useIsAppAdmin();

  const activeUserResponse = useQuery(
    api.users.queries.getActiveUser,
    () => (auth.isAuthenticated ? {} : "skip"),
    () => ({ initialData: initialData?.activeUser }),
  );
  const user = $derived(activeUserResponse?.data);

  let menuOpen = $state(false);
  let signInOpen = $state(false);

  const initials = $derived(
    (user?.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?",
  );
  // A phone-only sign-up has no email, only a placeholder one
  const secondLine = $derived(
    user?.email && !user.email.endsWith(".invalid") ? user.email : "",
  );

  const signOut = async () => {
    const result = await authClient.signOut();
    if (result.data?.success) {
      menuOpen = false;
      // Refreshes all data and runs the server hooks again
      refreshAll();
    }
  };
</script>

{#if auth.isAuthenticated && user}
  <Popover.Root bind:open={menuOpen}>
    <Popover.Trigger class="ui-account-trigger" aria-label="Account menu">
      <Avatar.Root class="ui-avatar">
        <Avatar.Image src={user.image} alt="" class="ui-avatar-image" />
        <Avatar.Fallback class="ui-account-initials">{initials}</Avatar.Fallback>
      </Avatar.Root>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content class="ui-account-menu" align="end" sideOffset={8}>
        <a href={resolve("/account")} class="who" onclick={() => (menuOpen = false)}>
          <Avatar.Root class="ui-avatar big">
            <Avatar.Image src={user.image} alt="" class="ui-avatar-image" />
            <Avatar.Fallback class="ui-account-initials">{initials}</Avatar.Fallback>
          </Avatar.Root>
          <span class="names">
            <b>{user.name}</b>
            {#if secondLine}<span class="small">{secondLine}</span>{/if}
          </span>
        </a>
        {#if authConstants.admin && admin.isAppAdmin}
          <a href={resolve(ADMIN_ROUTE)} class="item" onclick={() => (menuOpen = false)}>
            Admin
          </a>
        {/if}
        <button type="button" class="item" onclick={signOut}>Sign out</button>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
{:else if auth.isLoading || auth.isAuthenticated}
  <span class="waiting bone" aria-hidden="true"></span>
{:else if signInTrigger}
  {@render signInTrigger({ open: () => (signInOpen = true) })}
{:else}
  <Button onclick={() => (signInOpen = true)}>Sign in</Button>
{/if}

<Modal bind:open={signInOpen} title="Sign in" closeLabel="Close">
  <SignIn onSignIn={() => (signInOpen = false)} />
</Modal>

<style lang="postcss">
  @reference 'src/app.css';

  .waiting {
    @apply block size-10 rounded-full;
  }
  .who {
    @apply flex items-center gap-3 rounded-lg p-2 text-left;
  }
  .names {
    @apply flex min-w-0 flex-1 flex-col;
  }
  .names b {
    @apply truncate;
  }
  .small {
    @apply truncate text-xs text-text-muted;
  }
  .item {
    @apply flex min-h-11 items-center rounded-lg px-2 text-left font-semibold;
  }

  /* Bits renders these elements itself, so they are styled with :global */
  :global(.ui-account-trigger) {
    @apply grid size-11 place-items-center rounded-full;
  }
  :global(.ui-avatar) {
    --fill: var(--color-secondary);
    @apply edge-flat relative grid size-9 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-extrabold text-on-secondary;
  }
  :global(.ui-avatar.big) {
    @apply size-12 shrink-0;
  }
  :global(.ui-account-initials) {
    @apply grid size-full place-items-center;
  }
  :global(.ui-avatar-image) {
    @apply size-full object-cover;
  }
  :global(.ui-account-menu) {
    --fill: var(--color-foreground);
    @apply edge z-30 flex w-72 max-w-[calc(100vw-1rem)] flex-col gap-1 rounded-xl bg-foreground p-2 text-text;
  }
  :global(.ui-account-menu .who:hover),
  :global(.ui-account-menu .item:hover) {
    @apply bg-midground;
  }
</style>
