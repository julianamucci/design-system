<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { markContextMenuGroup } from "./context";

	let { ref = $bindable(null), ...restProps }: ContextMenuPrimitive.GroupProps = $props();

	// O `Label` aqui dentro passa a nomear este grupo — ver `context.ts`.
	markContextMenuGroup();
</script>

<ContextMenuPrimitive.Group bind:ref data-slot="context-menu-group" {...restProps} />
