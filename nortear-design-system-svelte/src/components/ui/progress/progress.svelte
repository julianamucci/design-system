<script lang="ts">
	/**
	 * Progress — barra passiva com `role="progressbar"` (bits-ui).
	 *
	 * A regra do valor é a compartilhada (`@shared/primitives/progress-value`),
	 * a mesma nas cinco stacks:
	 *
	 *  - `value` omitido, `null` ou não finito → INDETERMINADO. A bits-ui dá 0
	 *    quando o valor é omitido; o padrão aqui é `null`, igual ao `<progress>`
	 *    nativo, porque uma barra vazia parece travada onde a verdade é "não sei
	 *    quanto falta".
	 *  - `min` e `max` passam por `resolveProgressRange`: o limite, o percentual,
	 *    `--value` e `aria-valuemin`/`aria-valuemax` usam a MESMA faixa. Antes o
	 *    `min` ia para a lib por `restProps` e era anunciado, mas o limite e o
	 *    percentual contavam a partir de zero.
	 *  - `aria-valuetext` é escrito SEMPRE: o percentual arredondado ("42%"), ou
	 *    "Em andamento" sem valor. `getAriaValueText(value, min, max)` troca o
	 *    texto — recebe o valor já limitado e a faixa já resolvida.
	 */
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import {
		progressPercent,
		progressValueText,
		resolveProgressRange,
		resolveProgressValue,
	} from "@shared/primitives/progress-value";

	type Props = WithoutChildrenOrChild<ProgressPrimitive.RootProps> & {
		/** Texto anunciado no lugar do percentual. */
		getAriaValueText?: (value: number | null, min: number, max: number) => string;
	};

	let {
		ref = $bindable(null),
		class: className,
		value = null,
		min,
		max,
		getAriaValueText,
		...restProps
	}: Props = $props();

	// ─── O valor é limitado ANTES de ser anunciado e antes de ser desenhado ────
	//
	// A lib publica `aria-valuenow` com o número que recebe, sem conferir a
	// escala: um `value` acima do máximo anunciava um número que a barra não
	// desenha. Limitar aqui é o que faz o número lido e o pixel desenhado dizerem
	// a mesma coisa.
	const range = $derived(resolveProgressRange(min, max));
	const resolvedValue = $derived(resolveProgressValue(value, range));

	// Percentual (0–100) da faixa, que é o que a folha consome em `--value`.
	const percent = $derived(progressPercent(resolvedValue, range));

	const valueText = $derived(
		getAriaValueText
			? getAriaValueText(resolvedValue, range.min, range.max)
			: progressValueText(resolvedValue, range),
	);
</script>

<!-- `restProps` antes dos valores resolvidos: quem decide valor, faixa e texto
     anunciado é a regra compartilhada, não um atributo solto que venceria por
     chegar depois. -->
<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("nds-progress", className)}
	{...restProps}
	value={resolvedValue}
	min={range.min}
	max={range.max}
	aria-valuetext={valueText}
>
	<!-- Sem classe de animação aqui: a lib já marca `data-indeterminate` na raiz
	     quando `value` é null, e é desse atributo que o CSS compartilhado tira a
	     largura do traço e a animação.

	     Só a custom property: quem desenha é a folha compartilhada, que lê
	     `--value` (0–100) em `.nds-progress-indicator` e transiciona `transform`.
	     Escrever `transform` inline aqui SOBRESCREVERIA essa regra em vez de
	     alimentá-la. Sem valor, `--value` não é escrita: a folha põe o traço em
	     ciclo a partir de `data-indeterminate`, e uma propriedade em 0 esconderia
	     a barra fora da vista. -->
	<div
		data-slot="progress-indicator"
		class="nds-progress-indicator"
		style={percent == null ? undefined : `--value: ${percent}`}
	></div>
</ProgressPrimitive.Root>
