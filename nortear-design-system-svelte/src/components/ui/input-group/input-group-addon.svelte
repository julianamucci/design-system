<script lang="ts" module>
	/**
	 * Onde o addon fica. As duas em bloco fazem o grupo virar coluna.
	 *
	 * Era um `cva` com as quatro variantes mapeando para string VAZIA — código
	 * que finge existir uma classe por posição. Não existe: a folha
	 * compartilhada lê `[data-align]`, e é só de lá que a posição sai. Um mapa
	 * vazio ainda ensina a procurar `.nds-input-group-addon-inline-start` no
	 * CSS, e ela não está lá.
	 */
	export type InputGroupAlign = "inline-start" | "inline-end" | "block-start" | "block-end";
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		align = "inline-start",
		onclick,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		align?: InputGroupAlign;
	} = $props();

	/** Classe do campo interno — o mesmo gancho que a folha usa para acender a moldura. */
	const CONTROL_SELECTOR = ".nds-input-group-control";

	/**
	 * Clicar no addon leva o foco ao campo, e isso NÃO faz do addon um controle:
	 * é atalho de PONTEIRO para o que o campo já oferece ao teclado. Por isso ele
	 * não recebe `tabindex` — parada de tabulação que não leva a lugar nenhum foi
	 * o custo declarado do `stepper`, e não se repete aqui.
	 *
	 * O `onclick` de quem compõe é chamado ANTES e sempre: espalhado por
	 * `restProps`, ele seria simplesmente apagado por este manipulador, e o
	 * consumidor perderia o próprio clique sem nenhum aviso.
	 *
	 * O campo é procurado pela CLASSE, e não pelo elemento `input`: é o que faz o
	 * atalho alcançar também a área de texto. E o grupo é achado por
	 * `closest('[data-slot="input-group"]')`, e não por `parentElement`, que
	 * erraria o alvo assim que alguém envolvesse o addon num invólucro.
	 */
	function handleClick(
		event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement },
	): void {
		onclick?.(event);

		const target = event.target as Element | null;
		// Clique em botão é DO BOTÃO: sem esta guarda, apertar "limpar" devolveria
		// o foco ao campo no meio da ação, e o botão perderia o próprio foco.
		if (!target || target.closest("button")) return;

		const group = event.currentTarget.closest('[data-slot="input-group"]');
		group?.querySelector<HTMLElement>(CONTROL_SELECTOR)?.focus();
	}
</script>

<!-- O addon NÃO declara papel nenhum. É compartimento de decoração, e a folha
     diz isso na cara: `cursor: text` e `user-select: none` são de quem não é
     controle. O `role="group"` que estava aqui aninhava um agrupamento SEM NOME
     dentro do grupo de verdade — um degrau a mais que anuncia "grupo" e não
     informa nada.

     E não há supressão de aviso aqui, porque MEDIDO não há aviso: um par de
     `svelte-ignore` para `a11y_click_events_have_key_events` e
     `a11y_no_static_element_interactions` foi escrito e o lint reprovou os dois
     como `no-unused-svelte-ignore`. Fica registrado porque a saída errada seria
     a outra: devolver o `role` para calar um aviso é piorar a leitura para
     agradar o linter, e o clique daqui não acrescenta função nenhuma que o
     teclado já não alcance pelo campo. -->

<div
	bind:this={ref}
	data-slot="input-group-addon"
	data-align={align}
	class={cn("nds-input-group-addon", className)}
	onclick={handleClick}
	{...restProps}
>
	{@render children?.()}
</div>
