<script lang="ts">
	// Svelte
	import { tick } from 'svelte';

	// API
	import { useQuery, useConvexClient, useMutation } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '../../auth/context.svelte.js';
	const { api } = getAuthContext();
	const client = useConvexClient();
	const updateProfile = useMutation(api.users.mutations.updateProfile);
	const updateAvatar = useMutation(api.users.mutations.updateAvatar);

	// Icons
	import ProfileField from './ProfileField.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	import { Avatar as BitsAvatar } from 'bits-ui';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as ImageCropper from '../../primitives/ui/image-cropper/index.js';
	import { getFileFromUrl } from '../../primitives/ui/image-cropper/index.js';

	// Utils
	import { optimizeImage } from '../../primitives/utils/optimizeImage.js';

	// Types
	import type { GenericId } from 'convex/values';
	import type { GetActiveUserType } from '../../auth/types.js';

	// Props
	let { initialData }: { initialData?: { activeUser?: GetActiveUserType } } = $props();

	// Auth
	const auth = useAuth();

	// Query
	const activeUserResponse = useQuery(
		api.users.queries.getActiveUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeUser
		})
	);
	const activeUser = $derived(activeUserResponse?.data);

	// State
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let loadingStatus = $state('loading');
	let isUploading: boolean = $state(false);
	let cropSrc: string = $state('');

	let nameInputEl: HTMLInputElement | null = $state(null);

	let avatarKey: number = $state(0);

	// Initialize state when user data is available
	$effect(() => {
		if (activeUser && !isEditingName) {
			name = activeUser.name;
		}
	});

	// Keep crop preview in sync with current user image
	$effect(() => {
		if (activeUser?.image && !cropSrc.startsWith('blob:')) {
			cropSrc = activeUser.image;
		}
	});

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!activeUser) return;

		const trimmed = name.trim();

		try {
			if (!trimmed || trimmed === activeUser.name.trim()) {
				isEditingName = false;
				return;
			}
			name = trimmed;
			isEditingName = false;
			await updateProfile(
				{ name: trimmed },
				{
					optimisticUpdate: (store) => {
						const activeUser = store.getQuery(api.users.queries.getActiveUser, {});
						if (!activeUser) return;

						store.setQuery(
							api.users.queries.getActiveUser,
							{},
							{
								...activeUser,
								name: trimmed
							}
						);
					}
				}
			);
			toast.success('Profile name updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update profile: ${errorMsg}`);
		}
	}

	// Handle cropped image from ImageCropper
	async function handleCropped(url: string): Promise<void> {
		const previousImage = activeUser?.image ?? '';
		try {
			cropSrc = url;
			isUploading = true;
			// Convert cropped URL to File, then optimize and upload
			const croppedFile = await getFileFromUrl(url, 'avatar.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');

			const result = await response.json();
			const storageId = result.storageId as GenericId<'_storage'>;
			await updateAvatar(
				{ storageId, optimisticImage: url },
				{
					optimisticUpdate: (store, args) => {
						if (!args.optimisticImage) return;

						const activeUser = store.getQuery(api.users.queries.getActiveUser, {});
						if (!activeUser) return;

						store.setQuery(
							api.users.queries.getActiveUser,
							{},
							{
								...activeUser,
								image: args.optimisticImage
							}
						);
					}
				}
			);

			loadingStatus = 'loaded';
			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);
			cropSrc = previousImage;
			loadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}

	const displayedAvatarSrc = $derived(cropSrc || activeUser?.image || undefined);
	const showAvatarOverlay = $derived(
		!cropSrc.startsWith('blob:') &&
			(isUploading || (loadingStatus as 'loading' | 'loaded' | 'error') === 'loading')
	);
</script>

<div class="profile-info">
	{#if !activeUser}
		<div class="loading bone"></div>
	{:else}
		<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
			<div class="who">
				<ImageCropper.UploadTrigger>
					<span class="picture">
						{#key avatarKey}
							<BitsAvatar.Root
								class="photo"
								onLoadingStatusChange={(status) => (loadingStatus = status)}
							>
								<BitsAvatar.Image src={displayedAvatarSrc} alt={activeUser.name} class="fit" />
								<BitsAvatar.Fallback class="initials">
									{activeUser.name.trim().charAt(0).toUpperCase() || '?'}
								</BitsAvatar.Fallback>
							</BitsAvatar.Root>
						{/key}
						{#if showAvatarOverlay}
							<span class="busy"><Spinner /></span>
						{/if}
						<span class="pencil"><PencilIcon class="size-4" aria-hidden="true" /></span>
					</span>
				</ImageCropper.UploadTrigger>
				<p class="hint">Tap the picture to change it</p>
			</div>
			<ImageCropper.Dialog>
				<ImageCropper.Cropper cropShape="round" />
				<ImageCropper.Controls>
					<ImageCropper.Cancel />
					<ImageCropper.Crop>Upload</ImageCropper.Crop>
				</ImageCropper.Controls>
			</ImageCropper.Dialog>
		</ImageCropper.Root>

		<ProfileField
			label="Name"
			editing={isEditingName}
			editLabel="Edit name"
			onedit={async () => {
				isEditingName = true;
				name = activeUser.name;
				await tick();
				nameInputEl?.focus();
				nameInputEl?.select();
			}}
		>
			{#snippet icon()}<PencilIcon class="size-4" />{/snippet}
			{#snippet view()}<span class="truncate">{activeUser.name}</span>{/snippet}
			{#snippet edit()}
				<form onsubmit={handleSubmit} class="form">
					<Field label="Name" hideLabel>
						<input bind:this={nameInputEl} type="text" bind:value={name} />
					</Field>
					<div class="actions">
						<Button
							onclick={() => {
								name = activeUser.name;
								isEditingName = false;
							}}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={!name || name.trim() === '' || name.trim() === activeUser.name.trim()}
						>
							Save
						</Button>
					</div>
				</form>
			{/snippet}
		</ProfileField>
	{/if}
</div>

<style lang="postcss">
	@reference 'src/app.css';

	.profile-info {
		@apply flex flex-col gap-4;
	}
	.loading {
		@apply h-16 w-full rounded-container;
	}
	.who {
		@apply flex items-center gap-4;
	}
	.picture {
		@apply relative block size-20 cursor-pointer;
	}
	.picture :global(.photo) {
		--fill: var(--color-secondary);
		@apply edge-flat relative grid size-20 place-items-center overflow-hidden rounded-full bg-secondary text-3xl font-extrabold text-on-secondary;
	}
	.picture :global(.fit) {
		@apply size-full object-cover;
	}
	.picture :global(.initials) {
		@apply grid size-full place-items-center;
	}
	.busy {
		@apply absolute inset-0 grid place-items-center rounded-full bg-foreground/70;
	}
	.pencil {
		--fill: var(--color-foreground);
		@apply edge-flat absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-foreground;
	}
	.hint {
		@apply text-sm text-text-muted;
	}
	.form {
		@apply flex flex-col gap-3;
	}
	.actions {
		@apply grid grid-cols-2 gap-2;
	}
</style>
