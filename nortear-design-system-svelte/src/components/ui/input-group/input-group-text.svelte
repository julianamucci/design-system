<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<!-- Palavra ou ícone dentro do addon, em cor de apoio. Decoração, sem foco.

     O `data-slot` faltava, e era o único pedaço da família sem ele: sem esse
     gancho, achar o texto de apoio no DOM só sobrava por classe de aparência,
     que muda quando o desenho muda. As outras stacks já o declaravam. -->
<span
	bind:this={ref}
	data-slot="input-group-text"
	class={cn("nds-input-group-text", className)}
	{...restProps}
>
	{@render children?.()}
</span>
