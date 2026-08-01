<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<!-- <div>, não <nav>: paginação de mês não é landmark de navegação (referência vanilla:
     .nds-calendar-nav é <div>); como <nav>, cada calendário na página duplicava um
     landmark sem rótulo e o axe acusava landmark-unique. Mesma classe, zero pixel. -->
<div
	{...restProps}
	bind:this={ref}
	class={cn("nds-calendar-nav-overlay", className)}
>
	{@render children?.()}
</div>
