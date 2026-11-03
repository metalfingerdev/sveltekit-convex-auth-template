<script lang="ts">
	import ProfileInfo from './ProfileInfo.svelte';
	import Emails from './Emails.svelte';
	import PhoneNumber from './PhoneNumber.svelte';
	import DeleteUser from './DeleteUser.svelte';
	import Accounts from './Accounts.svelte';
	import ApiKeys from './ApiKeys.svelte';

	// Context
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { authConstants } = getAuthContext();

	// Types
	import type { GetActiveUserType, ListAccountsType } from '../../auth/types.js';

	let {
		initialData
	}: {
		initialData?: {
			activeUser?: GetActiveUserType;
			accountList?: ListAccountsType;
		};
	} = $props();
</script>

<div class="w-full">
	<div class="flex flex-col gap-3 pb-8">
		<ProfileInfo {initialData} />
		<Emails {initialData} />
		{#if authConstants.providers.phoneOTP}
			<PhoneNumber {initialData} />
		{/if}
	</div>

	<Accounts {initialData} />
	{#if authConstants.apiKeys}
		<ApiKeys />
	{/if}
	<DeleteUser />
</div>
