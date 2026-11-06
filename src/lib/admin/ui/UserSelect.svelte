<script lang="ts">
	// Primitives
	import * as Avatar from '../../primitives/ui/avatar/index.js';
	// Icons
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	// API
	import { useQuery } from 'convex-svelte';
	import { getAuthContext } from '../../auth/context.svelte.js';
	// Types
	import type { AdminUser } from '../types.js';

	let {
		value = $bindable(null),
		excludeIds = [],
		unavailableReason,
		id
	}: {
		/** The selected user */
		value: AdminUser | null;
		/** Users not to offer, like the organization's members */
		excludeIds?: string[];
		/** Why a user can't be picked, shown instead of their email; `undefined` when they can */
		unavailableReason?: (user: AdminUser) => string | undefined;
		/** Id of the trigger, for a `<label for>` */
		id?: string;
	} = $props();

	const { api } = getAuthContext();
	const listId = $props.id();

	// The list expands inline rather than in a popover: dialogs hide portaled content from
	// screen readers and clip content that isn't portaled
	let expanded = $state(false);
	let searchInput = $state('');
	let search = $state('');
	// Search runs 200ms after the last keystroke instead of on every one
	$effect(() => {
		const next = searchInput.trim();
		const timer = setTimeout(() => (search = next), 200);
		return () => clearTimeout(timer);
	});

	const results = useQuery(
		api.admin.queries.listUsers,
		() => (expanded ? { searchValue: search || undefined, limit: 20 } : 'skip'),
		{ keepPreviousData: true }
	);
	const users = $derived(
		(results.data?.users ?? []).filter((user) => !excludeIds.includes(user.id))
	);

	function toggle() {
		expanded = !expanded;
		if (expanded) {
			searchInput = '';
			search = '';
		}
	}

	function select(user: AdminUser) {
		value = user;
		expanded = false;
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#snippet userLabel(user: AdminUser, detail = user.email)}
	<Avatar.Root class="size-8 shrink-0">
		<Avatar.Image src={user.image ?? undefined} alt={user.name} />
		<Avatar.Fallback>
			<Avatar.Marble name={user.name} />
		</Avatar.Fallback>
	</Avatar.Root>
	<span class="flex min-w-0 flex-1 flex-col text-left">
		<span class="truncate text-sm">{user.name}</span>
		<span class="text-text-muted truncate text-xs">{detail}</span>
	</span>
{/snippet}

<div class="flex flex-col gap-1">
	<button
		{id}
		type="button"
		class="control flex min-h-12 w-full cursor-pointer items-center gap-3 py-2 text-left"
		aria-expanded={expanded}
		aria-controls={listId}
		onclick={toggle}
	>
		{#if value}
			{@render userLabel(value)}
		{:else}
			<span class="text-text-muted flex-1 text-sm">Select a user...</span>
		{/if}
		<ChevronDownIcon
			class="size-4 shrink-0 opacity-60 transition-transform {expanded ? 'rotate-180' : ''}"
			aria-hidden="true"
		/>
	</button>
	{#if expanded}
		<div
			id={listId}
			class="border-border-muted rounded-xl flex flex-col gap-1 border p-1"
		>
			<div class="relative">
				<SearchIcon
					class="text-border pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
					aria-hidden="true"
				/>
				<input
					type="search"
					class="control pl-9 text-sm"
					placeholder="Search by name or email..."
					aria-label="Search users by name or email"
					bind:value={searchInput}
					use:focusOnMount
					onkeydown={(event) => {
						// Enter would submit the dialog's form with the previous selection
						if (event.key === 'Enter') event.preventDefault();
					}}
				/>
			</div>
			<div class="flex max-h-56 flex-col overflow-y-auto">
				{#if results.error}
					<p class="text-danger p-3 text-sm">{results.error.message}</p>
				{:else if !results.data}
					<p class="text-text-muted flex items-center gap-2 p-3 text-sm" role="status">
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Loading users...
					</p>
				{:else if users.length === 0}
					<p class="text-text-muted p-3 text-sm">
						{search ? `No users match "${search}".` : 'Search by name or email to find a user.'}
					</p>
				{:else}
					{#each users as user (user.id)}
						{@const reason = unavailableReason?.(user)}
						<button
							type="button"
							class="hover:bg-background focus-visible:bg-background rounded-lg flex items-center gap-3 p-2 outline-hidden disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
							class:opacity-60={results.isStale}
							aria-pressed={value?.id === user.id}
							disabled={Boolean(reason)}
							onclick={() => select(user)}
						>
							{@render userLabel(user, reason)}
							{#if value?.id === user.id}
								<CheckIcon class="size-4 shrink-0" aria-hidden="true" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
