<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.IndicatorProps = $props();
</script>

<NavigationMenuPrimitive.Indicator
	bind:ref
	data-slot="navigation-menu-indicator"
	class={cn(
		"nds-navigation-menu-indicator",
		className
	)}
	{...restProps}
>
	<div class="nds-navigation-menu-indicator-arrow"></div>
</NavigationMenuPrimitive.Indicator>
