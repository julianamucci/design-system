<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		/**
		 * Nível do heading do título. Default `h5` (compatibilidade). Passe o
		 * nível que preserva a hierarquia de headings da página onde o Alert
		 * está (ex.: `h3` sob uma seção `h2`).
		 */
		as = "h5",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> & { as?: string } = $props();
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="alert-title"
	class={cn(
		"nds-alert-title",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
