<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { Button } from "@/components/ui/button/index.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		showCloseButton = false,
		closeLabel = "Fechar",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		showCloseButton?: boolean;
		/**
		 * Rótulo VISÍVEL do botão de fechar do rodapé — aqui ele fica lado a lado
		 * com as ações e é texto normal, não `nds-sr-only`. Mesma razão da prop
		 * homônima do Content: o literal em português prendia o primitivo a um
		 * idioma, e quem consome o design system noutro idioma tinha de reescrever
		 * o primitivo para trocar uma palavra. O default preserva todo call site.
		 */
		closeLabel?: string;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="dialog-footer"
	class={cn("nds-dialog-footer", className)}
	{...restProps}
>
	<!--
		O fechar vem ANTES do conteúdo, e não depois: ele é ação SECUNDÁRIA, e a
		folha empilha o rodapé em `column-reverse` (e alinha à direita a partir de
		40rem). Nas duas leituras a mesma ordem de DOM — secundários primeiro,
		primário por último — põe a ação primária no topo da pilha e à direita
		quando lado a lado. Renderizado depois de `children`, este botão ocupava
		exatamente a posição do primário.
	-->
	{#if showCloseButton}
		<DialogPrimitive.Close>
			{#snippet child({ props })}
				<Button variant="outline" {...props}>{closeLabel}</Button>
			{/snippet}
		</DialogPrimitive.Close>
	{/if}
	{@render children?.()}
</div>
