<script lang="ts" module>
	export const ITEM = Symbol('select-item');
</script>

<script lang="ts">
	import { setContext, type Snippet } from 'svelte';

	// Lets ItemIndicator know whether its item is the selected one
	let { selected, children }: { selected: boolean; children?: Snippet } = $props();
	setContext(ITEM, {
		get selected() {
			return selected;
		}
	});
</script>

{@render children?.()}
