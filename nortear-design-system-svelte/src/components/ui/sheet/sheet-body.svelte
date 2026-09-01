<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * Corpo rolável do painel.
	 *
	 * `tabindex="0"`, como no Vanilla: quando o conteúdo passa da altura do
	 * painel, a região rolável precisa ser alcançável por teclado (WCAG 2.1.1 —
	 * é a regra `scrollable-region-focusable` do axe). O `flex` do CSS
	 * compartilhado é o que mantém o rodapé no lugar enquanto o corpo rola.
	 */
	let {
		ref = $bindable(null),
		class: className,
		"aria-label": ariaLabel,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * O nome vem de quem compõe, por `aria-label`, e NÃO tem padrão.
		 *
		 * O conteúdo do painel é o que quem monta pôs lá dentro, e só ali se sabe o que
		 * é. Padrão genérico ("Conteúdo") anunciaria sem informar. Também não herdamos o
		 * título do painel: em quatro das cinco stacks o id dele é gerado pela lib por
		 * dentro e não alcança este subcomponente sem inventar um contexto — e o título já
		 * foi anunciado na abertura, então repeti-lo aqui informaria pouco pelo que custa.
		 *
		 * O que MUDOU é que o nome agora chega. Antes, um `aria-label` escrito aqui caía
		 * num `div` sem papel e era DESCARTADO pelo leitor de tela — atributo proibido,
		 * que o axe acusa como `aria-prohibited-attr`. Quem tentava nomear a região não
		 * tinha como saber que não funcionou. Agora o papel vem junto com o nome.
		 *
		 * `group` e não `region`: o corpo já vive dentro de um diálogo nomeado, e um
		 * marco aninhado num diálogo não acrescenta navegação — acrescenta entrada na
		 * lista.
		 */
		"aria-label"?: string;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	data-slot="sheet-body"
	tabindex="0"
	role={ariaLabel ? "group" : undefined}
	aria-label={ariaLabel}
	class={cn("nds-sheet-body", className)}
	{...restProps}
>
	{@render children?.()}
</div>
