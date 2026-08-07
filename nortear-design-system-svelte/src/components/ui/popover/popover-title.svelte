<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- role="heading": era um <div> sem semântica nenhuma. O React usa o
     `Popover.Title` do base-ui, que já é heading; aqui o título não era
     anunciado como tal e não servia de nome acessível para o diálogo. -->
<div
	bind:this={ref}
	data-slot="popover-title"
	role="heading"
	aria-level="2"
	class={cn("nds-popover-title", className)}
	{...restProps}
>
	{@render children?.()}
</div>
