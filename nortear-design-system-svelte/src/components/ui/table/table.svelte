<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		regionLabel,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> & {
		/**
		 * Nome acessível do container que rola. SEM PADRÃO, de propósito.
		 *
		 * O container é o WRAPPER, e não a `<table>`: são elementos diferentes e cada um
		 * tem o seu nome. Por isso a prop tem nome próprio e não é `aria-label` — um
		 * `aria-label` escrito aqui nomeia a TABELA, que é o comportamento certo e que
		 * não se quer roubar. O wrapper é o que quem monta não alcança, e é ele que entra
		 * na ordem de tabulação.
		 *
		 * O nome é do CONTEÚDO ("Faturas de 2026"), e o design system não tem como
		 * sabê-lo. Padrão genérico ("Tabela") anunciaria sem informar: quem chegou por Tab
		 * já sabe que rola, o que não sabe é o que rola. Sem nome NÃO emitimos papel
		 * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe acusa
		 * `aria-prohibited-attr`.
		 *
		 * `group` e não `region`: `region` com nome vira marco de página, e uma tela de
		 * relatório empilha várias tabelas — seriam vários marcos onde não há várias
		 * seções. Quem quiser marco envolve a tabela num `<section>` nomeado.
		 */
		regionLabel?: string;
	} = $props();
</script>

<!-- tabindex: .nds-table-wrapper tem overflow-x: auto — região rolável precisa
     ser alcançável por teclado (WCAG 2.1.1 / axe scrollable-region-focusable),
     e com papel e nome quando `regionLabel` chega — foco sozinho faz uma parada
     que o leitor de tela não sabe anunciar.

     A diretiva abaixo cala um falso positivo: a regra do compilador só aceita
     papel de widget, e nem `region` nem `group` a dispensam. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	data-slot="table-container"
	class="nds-table-wrapper"
	tabindex="0"
	role={regionLabel ? "group" : undefined}
	aria-label={regionLabel}
>
	<table bind:this={ref} data-slot="table" class={cn("nds-table", className)} {...restProps}>
		{@render children?.()}
	</table>
</div>
