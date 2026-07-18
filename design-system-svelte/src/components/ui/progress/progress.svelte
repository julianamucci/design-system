<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("nds-progress", className)}
	{value}
	{max}
	{...restProps}
>
	<div
		data-slot="progress-indicator"
		class={cn(
			"nds-progress-indicator",
			value == null && "animate-indeterminate w-1/3"
		)}
		style={value == null ? undefined : `transform: translateX(-${100 - (100 * value) / (max ?? 1)}%)`}
	></div>
</ProgressPrimitive.Root>
