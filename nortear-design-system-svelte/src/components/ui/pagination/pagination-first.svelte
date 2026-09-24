<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { buttonVariants, type ButtonSize } from "../button/index.js";
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		text = "",
		appearance = "ghost",
		"aria-label": ariaLabel = "Ir para a primeira página",
		...restProps
	}: WithElementRef<HTMLButtonAttributes> & {
		size?: ButtonSize;
		/**
		 * Texto visível do controle. Vazio por padrão: o salto vive nas PONTAS
		 * da faixa, onde o espaço é do ícone, e o duplo chevron já diz "vai até
		 * o fim".
		 */
		text?: string;
		/** Aparência do controle. Padrão `ghost` — ver a nota em pagination-link.svelte. */
		appearance?: "ghost" | "outline";
		"aria-label"?: string;
	} = $props();

	/** Sem texto visível o controle é quadrado — ver a nota em pagination-previous.svelte. */
	const iconOnly = $derived(!text);
</script>

<!--
	Salto para a primeira página. O DUPLO chevron é o que o separa do "anterior"
	ao lado: um passo contra uma ida até a ponta.

	É um `<button>` escrito aqui, e não uma peça da lib: a lib headless desta
	stack entrega Root, Page, PrevButton e NextButton — não há primitivo de
	primeira/última. Divergência de API de framework não se "alinha", se declara:
	por isso quem salta e quem desabilita no extremo é QUEM CONSOME, com
	`onclick` e `disabled`. O rodapé do DataTable, que é o consumidor real, já
	tinha as duas respostas na mão — elas vêm da tabela, não da faixa.
-->
<button
	bind:this={ref}
	type="button"
	aria-label={ariaLabel}
	data-slot="pagination-first"
	class={cn(
		buttonVariants({ variant: appearance, size: iconOnly ? "icon" : size }),
		iconOnly ? undefined : "nds-pagination-prev",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<ChevronsLeftIcon data-icon="inline-start" />
		{#if !iconOnly}
			<span class="nds-pagination-label">{text}</span>
		{/if}
	{/if}
</button>
