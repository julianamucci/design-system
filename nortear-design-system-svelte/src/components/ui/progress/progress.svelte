<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();

	// ─── O valor é limitado ANTES de ser anunciado e antes de ser desenhado ────
	//
	// A lib publica `aria-valuenow` com o número que recebe, sem conferir a
	// escala: um `value` acima do máximo anunciava um número que a barra não
	// desenha, e um negativo empurrava o indicador para fora do trilho pela
	// esquerda — as duas coisas com a barra VAZIA na tela. Limitar aqui é o que
	// faz o número lido e o pixel desenhado dizerem a mesma coisa.
	//
	// `null` (e a ausência) NÃO passam por aqui: sem valor é indeterminado, e
	// virar 0 diria "zero por cento" onde a verdade é "não sei quanto falta".
	const clampedValue = $derived(
		value == null ? value : Math.min(Math.max(value, 0), max),
	);

	// Percentual da escala, que é o que a folha consome. `max` zero não divide:
	// devolve 0, como a fábrica do vanilla.
	const percentage = $derived(
		clampedValue == null ? null : max > 0 ? (clampedValue / max) * 100 : 0,
	);
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("nds-progress", className)}
	value={clampedValue}
	{max}
	{...restProps}
>
	<!-- Sem classe de animação aqui: a lib já marca `data-indeterminate` na raiz
	     quando `value` é null, e é desse atributo que o CSS compartilhado tira a
	     largura do traço e a animação. As duas classes que moravam nesta linha
	     (`animate-indeterminate w-1/3`) não existem em CSS nenhum do projeto —
	     o indeterminado desenhava uma barra vazia e parada.

	     Só a custom property: quem desenha é a folha compartilhada, que lê
	     `--value` (0–100) em `.nds-progress-indicator` e transiciona `transform`.
	     Escrever `transform` inline aqui SOBRESCREVERIA essa regra em vez de
	     alimentá-la — estilo inline vence qualquer especificidade —, e era assim
	     que valor fora da faixa montava uma declaração inválida que o navegador
	     descartava. Sem valor, `--value` não é escrita: a folha põe o traço em
	     ciclo a partir de `data-indeterminate`, e uma propriedade em 0 esconderia
	     a barra fora da vista. -->
	<div
		data-slot="progress-indicator"
		class="nds-progress-indicator"
		style={percentage == null ? undefined : `--value: ${percentage}`}
	></div>
</ProgressPrimitive.Root>
