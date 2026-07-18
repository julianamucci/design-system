<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "vertical",
		children,
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	bind:ref
	data-slot="scroll-area-scrollbar"
	data-orientation={orientation}
	{orientation}
	class={cn(
		"nds-scroll-area-scrollbar",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ScrollAreaPrimitive.Thumb
		data-slot="scroll-area-thumb"
		class="nds-scroll-area-thumb"
	/>
</ScrollAreaPrimitive.Scrollbar>
