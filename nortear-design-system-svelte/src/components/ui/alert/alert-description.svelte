<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<section
	bind:this={ref}
	data-slot="alert-description"
	class={cn(
		"nds-alert-description",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</section>
