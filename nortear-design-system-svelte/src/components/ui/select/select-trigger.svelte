<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import { getContext } from "svelte";
	import { SELECT_LISTBOX_ID } from "./select-a11y.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();

	// `role="combobox"` exige `aria-controls` (axe aria-required-attr). O id vem
	// da raiz por contexto — descobrir o painel pelo DOM não funciona, ele é
	// portalado e só existe enquanto aberto. Ver `select-a11y.ts`.
	const listboxId = getContext<string | undefined>(SELECT_LISTBOX_ID);
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	role="combobox"
	aria-controls={listboxId}
	class={cn(
		"nds-select-trigger",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="nds-select-trigger-icon" />
</SelectPrimitive.Trigger>
