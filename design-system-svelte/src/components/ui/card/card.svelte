<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn(
		// PATCH: bugfix — has-[>[data-slot=card-footer]] restringe a filho direto para não zerar pb em Cards aninhados com footer (ver PATCHES.md#card-footer-direct-child)
		"nds-card",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
