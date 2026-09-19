<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { markMenuGroup } from "@/components/ui/menu-group-context";

	let {
		ref = $bindable(null),
		value = $bindable(),
		...restProps
	}: DropdownMenuPrimitive.RadioGroupProps = $props();

	// O grupo de rádio também é `role="group"`: um `Label` aqui dentro o nomeia
	// direto, sem um segundo grupo em volta — ver `menu-group-context.ts`.
	markMenuGroup("dropdown-menu");
</script>

<DropdownMenuPrimitive.RadioGroup
	bind:ref
	bind:value
	data-slot="dropdown-menu-radio-group"
	{...restProps}
/>
