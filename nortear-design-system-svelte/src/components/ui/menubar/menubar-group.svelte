<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { markMenuGroup } from "@/components/ui/menu-group-context";

	let {
		ref = $bindable(null),
		...restProps
	}: MenubarPrimitive.GroupProps & {
		inset?: boolean;
	} = $props();

	// O `Label` aqui dentro passa a nomear este grupo — ver `menu-group-context.ts`.
	markMenuGroup("menubar");
</script>

<MenubarPrimitive.Group bind:ref data-slot="menubar-group" {...restProps} />
