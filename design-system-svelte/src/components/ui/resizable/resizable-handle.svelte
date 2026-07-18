<script lang="ts">
	import * as ResizablePrimitive from "paneforge";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		withHandle = false,
		'aria-orientation': ariaOrientation,
		...restProps
	}: WithoutChildrenOrChild<ResizablePrimitive.PaneResizerProps> & {
		withHandle?: boolean;
		'aria-orientation'?: 'horizontal' | 'vertical';
	} = $props();
</script>

<ResizablePrimitive.PaneResizer
	bind:ref
	data-slot="resizable-handle"
	aria-orientation={ariaOrientation}
	class={cn(
		"nds-resizable-handle",
		className
	)}
	{...restProps}
>
	{#if withHandle}
		<div class="nds-resizable-grip-bar"></div>
	{/if}
</ResizablePrimitive.PaneResizer>
