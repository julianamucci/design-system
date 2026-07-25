<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		/**
		 * Elemento a renderizar. Default `div` (neutro, sem forçar hierarquia de
		 * headings). Passe `h2`..`h6` quando o título do card for um heading real
		 * na hierarquia da página.
		 */
		as = "div",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { as?: string } = $props();
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="card-title"
	class={cn("nds-card-title", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
