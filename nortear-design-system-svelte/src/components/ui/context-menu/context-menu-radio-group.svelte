<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { markContextMenuGroup } from "./context";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		...restProps
	}: ContextMenuPrimitive.RadioGroupProps = $props();

	// O grupo de rádio também é `role="group"`: um `Label` aqui dentro o nomeia
	// direto, sem um segundo grupo em volta — ver `context.ts`.
	markContextMenuGroup();
</script>

<ContextMenuPrimitive.RadioGroup
	bind:ref
	bind:value
	data-slot="context-menu-radio-group"
	{...restProps}
/>
