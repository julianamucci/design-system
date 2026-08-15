<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// A caixa do esqueleto vem de `data-shape` / `data-width` (ver
	// docs/shared/styles/nds/skeleton.css), nunca de altura cravada: altura é
	// resultado de padding + tipografia, para o bloco crescer junto quando a
	// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
	//
	// `aria-hidden` sai marcado de fábrica — o placeholder é ruído para leitor
	// de tela, e quem anuncia o carregamento é a região que o contém.
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	aria-hidden="true"
	class={cn("nds-skeleton", className)}
	{...restProps}
></div>
