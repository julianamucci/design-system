<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { markMenuGroup } from "@/components/ui/menu-group-context";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		...restProps
	}: MenubarPrimitive.RadioGroupProps = $props();

	// O grupo de rádio também é `role="group"`: um `Label` aqui dentro o nomeia
	// direto, sem um segundo grupo em volta — ver `menu-group-context.ts`.
	markMenuGroup("menubar");
</script>

<MenubarPrimitive.RadioGroup bind:ref bind:value data-slot="menubar-radio-group" {...restProps} />
