<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn } from "@/lib/utils.js";
	import { useMenuSub } from "./sub-escape";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: DropdownMenuPrimitive.SubTriggerProps & {
		inset?: boolean;
	} = $props();

	// O submenu devolve o foco a este nó quando o Escape o fecha — ver `sub-escape.ts`.
	const sub = useMenuSub();
	$effect(() => {
		sub?.setTrigger(ref);
	});
</script>

<DropdownMenuPrimitive.SubTrigger
	bind:ref
	data-slot="dropdown-menu-sub-trigger"
	data-inset={inset}
	class={cn("nds-dropdown-menu-sub-trigger", className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRightIcon class="nds-dropdown-menu-sub-trigger-chevron" />
</DropdownMenuPrimitive.SubTrigger>
