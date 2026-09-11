<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { useMenuSub } from "@/components/ui/dropdown-menu/sub-escape";

	let {
		ref = $bindable(null),
		class: className,
		inset = undefined,
		children,
		...restProps
	}: WithoutChild<MenubarPrimitive.SubTriggerProps> & {
		inset?: boolean;
	} = $props();

	// O submenu devolve o foco a este nó quando o Escape o fecha — ver
	// `dropdown-menu/sub-escape.ts`.
	const sub = useMenuSub();
	$effect(() => {
		sub?.setTrigger(ref);
	});
</script>

<MenubarPrimitive.SubTrigger
	bind:ref
	data-slot="menubar-sub-trigger"
	data-inset={inset}
	class={cn("nds-dropdown-menu-sub-trigger", className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRightIcon class="nds-dropdown-menu-sub-trigger-chevron" />
</MenubarPrimitive.SubTrigger>
