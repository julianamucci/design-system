<script lang="ts">
	import { Separator as SeparatorPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		"data-slot": dataSlot = "separator",
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
	bind:ref
	data-slot={dataSlot}
	class={cn(
		"nds-separator",
		// this is different in shadcn/ui but self-stretch breaks things for us
		"",
		className
	)}
	{...restProps}
/>
