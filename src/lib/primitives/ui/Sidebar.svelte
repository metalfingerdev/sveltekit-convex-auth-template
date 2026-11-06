<script lang="ts">
	interface Props {
		currentSection?: string;
	}

	let { currentSection = 'Profile' }: Props = $props();
</script>

<aside
	class="rounded-l-xl bg-background border-border w-full border-r p-6 md:w-1/4"
>
	<ul>
		<li class="text-text mb-4 font-semibold">Account</li>
		<li class="text-text-muted">{currentSection}</li>
		<li class="text-text mt-4">Security</li>
	</ul>
</aside>
