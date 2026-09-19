<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { markMenuGroup } from "@/components/ui/menu-group-context";

	let { ref = $bindable(null), ...restProps }: DropdownMenuPrimitive.GroupProps = $props();

	// O `Label` aqui dentro passa a nomear este grupo — ver `menu-group-context.ts`.
	markMenuGroup("dropdown-menu");
</script>

<DropdownMenuPrimitive.Group bind:ref data-slot="dropdown-menu-group" {...restProps} />
