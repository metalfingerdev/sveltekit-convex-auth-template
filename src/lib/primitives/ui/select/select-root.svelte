<script lang="ts" module>
	export type SelectItem = { label: string; value: string; disabled?: boolean };
	export const SELECT = Symbol('select');

	/** A stand-in for Ark's `createListCollection`: the items are `{ label, value }` objects */
	export function createListCollection<T extends SelectItem>(options: { items: T[] }) {
		return { items: options.items };
	}
</script>

<script lang="ts">
	import { Select } from 'bits-ui';
	import { setContext, type Snippet } from 'svelte';

	// Same props as the old Ark select: `collection`, `value` as an array, `onSelect` and
	// `onValueChange` get `{ value }`
	let {
		collection,
		value = $bindable<string[]>([]),
		disabled = false,
		onSelect,
		onValueChange,
		children
	}: {
		collection: { items: SelectItem[] };
		value?: string[];
		disabled?: boolean;
		onSelect?: (details: { value: string }) => void;
		onValueChange?: (details: { value: string[] }) => void;
		children?: Snippet;
	} = $props();

	setContext(SELECT, {
		get items() {
			return collection.items;
		},
		get value() {
			return value[0];
		}
	});
</script>

<Select.Root
	type="single"
	value={value[0] ?? ''}
	items={collection.items}
	{disabled}
	onValueChange={(next) => {
		value = [next];
		onSelect?.({ value: next });
		onValueChange?.({ value: [next] });
	}}
>
	{@render children?.()}
</Select.Root>
