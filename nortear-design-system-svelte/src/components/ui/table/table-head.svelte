<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLThAttributes } from "svelte/elements";

	// `scope` nasce em "col" porque uma tabela sem ele é uma grade muda: o leitor
	// de tela lê os valores sem dizer de que coluna vieram (WCAG 1.3.1). Quem tem
	// cabeçalho de linha passa scope="row" e sobrescreve.
	let {
		ref = $bindable(null),
		class: className,
		scope = "col",
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th bind:this={ref} data-slot="table-head" {scope} class={cn("", className)} {...restProps}>
	{@render children?.()}
</th>
