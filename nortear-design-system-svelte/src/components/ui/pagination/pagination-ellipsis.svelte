<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef, type WithoutChildren } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<!--
	O caractere `…` (U+2026) como TEXTO do elemento — não um ícone de três pontos,
	e sem texto `sr-only` dentro. Um `sr-only` sob `aria-hidden` não é lido por
	leitor de tela nenhum: era conteúdo invisível para todo mundo, e em inglês.
	O número que as reticências escondem já está nos links vizinhos.
-->
<span
	bind:this={ref}
	aria-hidden="true"
	data-slot="pagination-ellipsis"
	class={cn("nds-pagination-ellipsis", className)}
	{...restProps}
>
	…
</span>
