<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!--
	Divisória própria, e não a da lib.

	O primitivo emite `role="group"` neste elemento (medido em sonda) e mescla os
	próprios atributos por último, então passar `role="separator"` por fora não o
	alcança. Um separador anunciado como grupo cria um agrupamento vazio no leitor
	de tela e some com a divisória — as outras quatro stacks emitem `separator`, e
	é o que o conteúdo compartilhado descreve.

	Não há comportamento a perder: a divisória não é focável nem entra na roda de
	itens. Mesmo caminho que o `context-menu-label.svelte` já seguia.
-->
<div
	bind:this={ref}
	role="separator"
	aria-orientation="horizontal"
	data-slot="context-menu-separator"
	class={cn("nds-dropdown-menu-separator", className)}
	{...restProps}
></div>
