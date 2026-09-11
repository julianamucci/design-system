<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { useContextMenuSubContext } from "./context";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.SubTriggerProps> & {
		inset?: boolean;
	} = $props();

	// O submenu devolve o foco a este nó quando o Escape o fecha — ver `context.ts`.
	const sub = useContextMenuSubContext();
	$effect(() => {
		sub?.setTrigger(ref);
	});
</script>

<ContextMenuPrimitive.SubTrigger
	bind:ref
	data-slot="context-menu-sub-trigger"
	data-inset={inset || undefined}
	class={cn("nds-dropdown-menu-sub-trigger", className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRightIcon class="nds-dropdown-menu-sub-trigger-chevron" />
</ContextMenuPrimitive.SubTrigger>
