<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<h5
	bind:this={ref}
	data-slot="alert-title"
	class={cn(
		"nds-alert-title",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</h5>
