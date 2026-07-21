<script lang="ts" module>
	import { cn } from "@/lib/utils.js";
	import { cva } from "class-variance-authority";

	export const navigationMenuTriggerStyle = cva("nds-navigation-menu-trigger", {
		
	});
</script>

<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
	bind:ref
	data-slot="navigation-menu-trigger"
	class={cn(navigationMenuTriggerStyle(), "group", className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="nds-navigation-menu-chevron" aria-hidden="true" />
</NavigationMenuPrimitive.Trigger>
