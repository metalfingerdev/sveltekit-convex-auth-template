<script lang="ts">
  // Svelte
  import { page } from "$app/state";
  import { gotoApp } from "../../primitives/utils/navigation.js";
  import { tick } from "svelte";

  // Context
  import { getAuthContext } from "../../auth/context.svelte.js";
  const { api, authClient, authConstants } = getAuthContext();

  // UI Components
  // Primitives
  import Modal from "#lib/ui/Modal.svelte";
  import Button from "#lib/ui/Button.svelte";
  import Field from "#lib/ui/Field.svelte";
  import * as Password from "../../primitives/ui/password/index.js";
  import { toast } from "svelte-sonner";

  // Icons
  import SiGithub from "@icons-pack/svelte-simple-icons/icons/SiGithub";
  import SiGoogle from "@icons-pack/svelte-simple-icons/icons/SiGoogle";
  import SiFacebook from "@icons-pack/svelte-simple-icons/icons/SiFacebook";
  import SiApple from "@icons-pack/svelte-simple-icons/icons/SiApple";
  import SiAtlassian from "@icons-pack/svelte-simple-icons/icons/SiAtlassian";
  import SiDiscord from "@icons-pack/svelte-simple-icons/icons/SiDiscord";
  import SiFigma from "@icons-pack/svelte-simple-icons/icons/SiFigma";
  import SiLine from "@icons-pack/svelte-simple-icons/icons/SiLine";
  import SiHuggingface from "@icons-pack/svelte-simple-icons/icons/SiHuggingface";
  import SiKakao from "@icons-pack/svelte-simple-icons/icons/SiKakao";
  import SiKick from "@icons-pack/svelte-simple-icons/icons/SiKick";
  import SiPaypal from "@icons-pack/svelte-simple-icons/icons/SiPaypal";
  import SiNotion from "@icons-pack/svelte-simple-icons/icons/SiNotion";
  import SiNaver from "@icons-pack/svelte-simple-icons/icons/SiNaver";
  import SiTiktok from "@icons-pack/svelte-simple-icons/icons/SiTiktok";
  import SiTwitch from "@icons-pack/svelte-simple-icons/icons/SiTwitch";
  import SiX from "@icons-pack/svelte-simple-icons/icons/SiX";
  import SiDropbox from "@icons-pack/svelte-simple-icons/icons/SiDropbox";
  import SiLinear from "@icons-pack/svelte-simple-icons/icons/SiLinear";
  import SiGitlab from "@icons-pack/svelte-simple-icons/icons/SiGitlab";
  import SiReddit from "@icons-pack/svelte-simple-icons/icons/SiReddit";
  import SiRoblox from "@icons-pack/svelte-simple-icons/icons/SiRoblox";
  import SiSpotify from "@icons-pack/svelte-simple-icons/icons/SiSpotify";
  import SiVk from "@icons-pack/svelte-simple-icons/icons/SiVk";
  import SiZoom from "@icons-pack/svelte-simple-icons/icons/SiZoom";
  import {
    SiSalesforce,
    SiSlack,
  } from "../../primitives/ui/brand-icons/index.js";
  import KeyRoundIcon from "@lucide/svelte/icons/key-round";
  import LockIcon from "@lucide/svelte/icons/lock";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";

  // Utils
  import { useMobileState } from "../../primitives/utils/mobileState.svelte.js";
  const mobileState = useMobileState();
  import {
    isEditableElement,
    scheduleScrollIntoView,
  } from "../../primitives/utils/focusScroll.js";

  // API
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { useConvexClient, useQuery } from "convex-svelte";
  import { ConvexError } from "convex/values";
  const client = useConvexClient();

  // Types
  import type { ListAccountsType } from "../../auth/types.js";

  let { initialData }: { initialData?: { accountList?: ListAccountsType } } =
    $props();

  // Auth
  const auth = useAuth();

  let accountListResponse = useQuery(
    api.users.queries.listAccounts,
    () => (auth.isAuthenticated ? {} : "skip"),
    () => ({
      initialData: initialData?.accountList,
    }),
  );
  let accountList = $derived(accountListResponse?.data);

  // State for linking accounts
  let isLinking = $state(false);
  let unlinkingAccountId = $state<string | null>(null);

  // State for the set-password dialog
  let isPasswordDialogOpen = $state(false);
  let password = $state("");
  let isSettingPassword = $state(false);

  // State for change password (inline editing)
  let isEditingPasswordInline: boolean = $state(false);
  let currentPassword = $state("");
  let newPassword = $state("");
  let isChangingPassword = $state(false);
  let currentPasswordInputEl: HTMLInputElement | null = $state(null);
  let isMobile = $derived(mobileState.isMobile);

  // Auto-scroll inline Update Password form into view on mobile when opened
  $effect(() => {
    if (isMobile && isEditingPasswordInline && currentPasswordInputEl) {
      // Let layout settle then scroll; scheduleScrollIntoView is keyboard-aware
      requestAnimationFrame(() =>
        scheduleScrollIntoView(currentPasswordInputEl as HTMLElement, {
          block: "center",
        }),
      );
    }
  });

  // Get available providers (only enabled ones, exclude emailOTP, magicLink and phoneOTP, which
  // aren't OAuth providers: linkSocial would 404 with PROVIDER_NOT_FOUND. Phone lives in PhoneNumber.svelte)
  const allProviders = Object.keys(authConstants.providers).filter(
    (provider) =>
      provider !== "emailOTP" &&
      provider !== "magicLink" &&
      provider !== "phoneOTP" &&
      authConstants.providers[
        provider as keyof typeof authConstants.providers
      ] === true,
  );

  // Get providers that can be linked (not already linked)
  let availableProviders = $derived.by(() => {
    if (!accountList) return [];
    const linkedProviders = accountList.map((account) => account.providerId);
    return allProviders.filter((provider) => {
      // Handle the special case where 'password' in allProviders matches 'credential' in linkedProviders
      if (provider === "password") {
        return !linkedProviders.includes("credential");
      }
      return !linkedProviders.includes(provider);
    });
  });

  type ProviderIconComponent = typeof KeyRoundIcon | typeof SiGithub;
  const providerIconMap: Record<string, ProviderIconComponent> = {
    credential: KeyRoundIcon,
    github: SiGithub,
    google: SiGoogle,
    facebook: SiFacebook,
    apple: SiApple,
    atlassian: SiAtlassian,
    discord: SiDiscord,
    figma: SiFigma,
    line: SiLine,
    huggingface: SiHuggingface,
    kakao: SiKakao,
    kick: SiKick,
    paypal: SiPaypal,
    salesforce: SiSalesforce,
    slack: SiSlack,
    notion: SiNotion,
    naver: SiNaver,
    tiktok: SiTiktok,
    twitch: SiTwitch,
    x: SiX,
    dropbox: SiDropbox,
    linear: SiLinear,
    gitlab: SiGitlab,
    reddit: SiReddit,
    roblox: SiRoblox,
    spotify: SiSpotify,
    vk: SiVk,
    zoom: SiZoom,
  };

  const getProviderIcon = (provider: string) => {
    return providerIconMap[provider] ?? LockIcon;
  };


  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "credential":
        return "Password";
      case "huggingface":
        return "Hugging Face";
      case "x":
        return "X";
      case "github":
        return "GitHub";
      case "gitlab":
        return "GitLab";
      case "tiktok":
        return "TikTok";
      case "paypal":
        return "PayPal";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  // OAuth callback handling guard (prevents duplicate toasts)
  let handledCallbackKey: string | null = $state(null);

  function mapLinkErrorMessage(code: string): string {
    switch (code) {
      case "account_already_linked_to_different_user":
        return "This account is already linked to another user.";
      case "account_already_linked":
        return "This account is already linked.";
      case "account_linking_disabled":
        return "Linking accounts is disabled. Please contact support.";
      default:
        return "Failed to link account. Please try again.";
    }
  }

  // Handle Better Auth OAuth callbacks
  $effect(() => {
    const errorCode = page.url.searchParams.get("error");
    const success = page.url.searchParams.get("success");
    const key = errorCode ? `e:${errorCode}` : success ? `s:${success}` : null;
    if (!key || handledCallbackKey === key) return;
    handledCallbackKey = key;

    if (errorCode) {
      toast.error(mapLinkErrorMessage(errorCode));
    } else if (success) {
      toast.success(success);
    }

    // Sanitize current URL in-place: remove success/error
    const url = new URL(page.url.href);
    url.searchParams.delete("success");
    url.searchParams.delete("error");
    void gotoApp(url, {
      replace: true,
      reset: false,
      refreshAll: false,
    });
  });

  const linkAccount = async (provider: string) => {
    console.log("Linking account:", provider);
    if (isLinking) return;
    isLinking = true;

    if (provider === "password") {
      // For credential, open dialog/drawer for input
      password = "";
      isPasswordDialogOpen = true;
      isLinking = false; // Reset linking state, will be set again in handlePasswordSubmit
      return;
    } else {
      // For social providers
      const baseUrl = new URL(page.url.href);
      // Success URL carries a friendly message
      const successMsg = `${getProviderLabel(provider)} account linked successfully`;
      const successUrl = new URL(baseUrl);
      successUrl.searchParams.set("success", successMsg);
      // Error URL must NOT contain success param
      const errorUrl = new URL(baseUrl);
      errorUrl.searchParams.delete("success");

      await authClient.linkSocial({
        provider,
        callbackURL: successUrl.toString(),
        errorCallbackURL: errorUrl.toString(),
      });
      // Don't toast here. Success/failure will be handled after redirect via the effect above.
    }
    isLinking = false;
  };

  const handlePasswordSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    form.dataset.submitted = "true";
    if (!form.checkValidity()) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    isSettingPassword = true;
    try {
      const success = await setPassword(password);
      if (success) {
        isPasswordDialogOpen = false;
        password = "";
      }
    } catch {
      // No-op, errors are handled in setPassword
    } finally {
      isSettingPassword = false;
    }
  };

  const unlinkAccount = async (accountId: string, provider: string) => {
    if (!accountList || accountList.length <= 1) {
      toast.error("You must have at least one account linked");
      return;
    }

    if (unlinkingAccountId) return;
    unlinkingAccountId = accountId;

    // try {
    const { error } = await authClient.unlinkAccount({
      providerId: provider,
      accountId,
    });
    if (error) {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(error.statusText);
      }
    } else {
      toast.success(
        `${getProviderLabel(provider)} account unlinked successfully`,
      );
    }
    unlinkingAccountId = null;
  };

  const setPassword = async (password: string): Promise<boolean> => {
    try {
      await client.mutation(api.users.mutations.setPassword, { password });
      toast.success("Password set successfully");
      return true;
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(error.data);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to set password");
      }
      return false;
    }
  };

  const handleChangePasswordSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    form.dataset.submitted = "true";
    if (!form.checkValidity()) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    isChangingPassword = true;
    try {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
      });

      if (error) {
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error(error.statusText ?? "Failed to change password");
        }
        return;
      }

      toast.success("Password changed successfully");
      // Close inline editor and reset fields
      isEditingPasswordInline = false;
      currentPassword = "";
      newPassword = "";
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      isChangingPassword = false;
    }
  };
</script>

<section class="accounts">
  <h2 class="heading">Linked accounts</h2>
  {#if accountList === undefined || accountList === null}
    <div class="loading bone"></div>
  {:else if accountList.length === 0}
    <p class="muted">No accounts found</p>
  {:else}
    <ul class="list">
      {#each accountList as account (account.id)}
        {@const ProviderIcon = getProviderIcon(account.providerId)}
        <li class="row">
          <div class="line">
            <span class="name">
              <ProviderIcon size={16} />
              {getProviderLabel(account.providerId)}
            </span>
            <span class="buttons">
              {#if account.providerId === "credential"}
                <Button
                  onclick={async () => {
                    isEditingPasswordInline = true;
                    currentPassword = "";
                    newPassword = "";
                    await tick();
                    currentPasswordInputEl?.focus();
                  }}
                >
                  Update
                </Button>
              {/if}
              {#if accountList.length > 1}
                <Button
                  icon
                  aria-label="Unlink {getProviderLabel(account.providerId)}"
                  disabled={unlinkingAccountId === account.id}
                  onclick={() =>
                    unlinkAccount(account.accountId, account.providerId)}
                >
                  <Trash2Icon class="size-4" />
                </Button>
              {/if}
            </span>
          </div>
          {#if account.providerId === "credential" && isEditingPasswordInline}
            <form onsubmit={handleChangePasswordSubmit} class="form">
              <Field label="Current password" hideLabel>
                <input
                  bind:this={currentPasswordInputEl}
                  type="password"
                  bind:value={currentPassword}
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                  required
                  disabled={isChangingPassword}
                />
              </Field>
              <Password.Root>
                <Password.Input
                  bind:value={newPassword}
                  placeholder="Enter your new password"
                  autocomplete="new-password"
                  required
                  disabled={isChangingPassword}
                >
                  <Password.ToggleVisibility />
                </Password.Input>
                <Password.Error />
                <Password.Strength />
              </Password.Root>
              <div class="actions">
                <Button
                  onclick={() => {
                    currentPassword = "";
                    newPassword = "";
                    isEditingPasswordInline = false;
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isChangingPassword ||
                    !currentPassword ||
                    !newPassword}
                >
                  {isChangingPassword ? "Changing..." : "Change password"}
                </Button>
              </div>
            </form>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if availableProviders.length > 0}
    <div class="link">
      <p class="muted">Link a new account</p>
      <div class="buttons">
        {#each availableProviders as provider (provider)}
          {@const ProviderIcon = getProviderIcon(provider)}
          <Button onclick={() => linkAccount(provider)} disabled={isLinking}>
            <ProviderIcon size={16} />
            {getProviderLabel(provider)}
          </Button>
        {/each}
      </div>
      {#if isLinking}<p class="muted">Linking account...</p>{/if}
    </div>
  {/if}
</section>

<Modal bind:open={isPasswordDialogOpen} title="Set password" closeLabel="Close">
  <form onsubmit={handlePasswordSubmit} class="form">
    <h2 class="heading">Set password</h2>
    <Password.Root>
      <Password.Input
        bind:value={password}
        placeholder="Enter your password"
        required
      >
        <Password.ToggleVisibility />
      </Password.Input>
      <Password.Error />
      <Password.Strength />
    </Password.Root>
    <div class="actions">
      <Button onclick={() => (isPasswordDialogOpen = false)}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={isSettingPassword}>
        {isSettingPassword ? "Setting..." : "Set password"}
      </Button>
    </div>
  </form>
</Modal>

<style lang="postcss">
  @reference 'src/app.css';

  .accounts {
    @apply flex flex-col gap-3;
  }
  .heading {
    @apply text-lg font-extrabold;
  }
  .muted {
    @apply text-sm text-text-muted;
  }
  .loading {
    @apply h-14 w-full rounded-container;
  }
  .list {
    @apply flex flex-col gap-2;
  }
  .row {
    --fill: var(--color-midground);
    @apply edge-flat flex flex-col gap-3 rounded-container bg-midground p-3;
  }
  .line {
    @apply flex items-center justify-between gap-2;
  }
  .name {
    @apply flex items-center gap-3 text-sm font-semibold;
  }
  .buttons {
    @apply flex flex-wrap items-center gap-2;
  }
  .form {
    @apply flex flex-col gap-3;
  }
  .actions {
    @apply grid grid-cols-2 gap-2;
  }
  .link {
    @apply flex flex-col gap-2;
  }
</style>
