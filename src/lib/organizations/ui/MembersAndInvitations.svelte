<script lang="ts">
	// Primitives
	import * as Tabs from '../../primitives/ui/tabs/index.js';
	import * as Dialog from '../../primitives/ui/dialog/index.js';
	import * as Drawer from '../../primitives/ui/drawer/index.js';
	// Icons
	import PlusIcon from '@lucide/svelte/icons/plus';
	// Components
	import Members from './Members.svelte';
	import Invitations from './Invitations.svelte';
	import InviteMembers from './InviteMembers.svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { useRoles } from '../api/roles.svelte.js';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { api } = getAuthContext();

	// Types
	import type { GetActiveOrganizationType, ListInvitationsType, Role } from '../../auth/types.js';

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization?: GetActiveOrganizationType;
			invitationList?: ListInvitationsType;
			role?: Role;
		};
	} = $props();

	// Auth
	const auth = useAuth();
	const roles = useRoles({}, () => ({
		initialData: initialData?.role
	}));
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// Queries
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeOrganization
		})
	);
	const invitationListResponse = useQuery(
		api.organizations.invitations.queries.listInvitations,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.invitationList
		})
	);
	// Derived data
	const activeOrganization = $derived(activeOrganizationResponse?.data);
	const members = $derived(activeOrganization?.members);
	const invitationList = $derived(invitationListResponse?.data);

	// State
	let inviteMembersDrawerOpen = $state(false);
	let inviteMembersDialogOpen = $state(false);

	// Handlers
	function handleInviteMembersSuccess() {
		inviteMembersDialogOpen = false;
		inviteMembersDrawerOpen = false;
	}
</script>

<Tabs.Root value="members">
	<div
		class="border-border-muted flex w-full flex-row justify-between border-b pb-6 align-middle"
	>
		<Tabs.List class="flex-1 md:flex-initial">
			<Tabs.Trigger value="members" class="flex-1 gap-2 md:flex-initial">
				Members
				<span class="tag tone-sunken size-6 rounded-full">
					{members && `${members.length}`}
				</span>
			</Tabs.Trigger>
			{#if isOwnerOrAdmin}
				<Tabs.Trigger value="invitations" class="flex-1 gap-2 md:flex-initial">
					Invitations
					<span class="tag tone-sunken size-6 rounded-full">
						{invitationList && `${invitationList.filter((i) => i.status === 'pending').length}`}
					</span>
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		{#if isOwnerOrAdmin}
			<button
				type="button"
				class="button tone-primary hidden h-10 items-center gap-2 text-sm md:flex"
				onclick={() => (inviteMembersDialogOpen = true)}
			>
				<PlusIcon class="size-5" />
				<span>Invite members</span>
			</button>
			<Dialog.Root bind:open={inviteMembersDialogOpen}>
				<Dialog.Content class="max-w-100">
					<Dialog.Header>
						<Dialog.Title>Invite new members</Dialog.Title>
					</Dialog.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} {initialData} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
			<Drawer.Root bind:open={inviteMembersDrawerOpen}>
				<Drawer.Trigger
					class="button tone-primary absolute right-4 bottom-4 z-10 h-10 text-sm md:hidden"
				>
					<PlusIcon class="size-5" /> Invite members
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Invite new members</Drawer.Title>
					</Drawer.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} {initialData} />
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</div>

	<Tabs.Content value="members">
		<Members {initialData} />
	</Tabs.Content>

	{#if isOwnerOrAdmin}
		<Tabs.Content value="invitations">
			<Invitations {initialData} />
		</Tabs.Content>
	{/if}
</Tabs.Root>
