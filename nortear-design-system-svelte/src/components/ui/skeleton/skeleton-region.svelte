<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "@/lib/utils.js";

	/**
	 * A região que ESPERA o conteúdo — quem anuncia o carregamento.
	 *
	 * O esqueleto em si é `aria-hidden`: placeholder é ruído para leitor de tela.
	 * Quem fala é esta caixa em volta, e por isso ela carrega os três atributos
	 * juntos:
	 *
	 * - `role="status"`, porque `aria-busy` sozinho num `div` sem papel não é
	 *   anunciado;
	 * - `aria-busy="true"`, que é o estado — ao virar `false` é o que diz ao
	 *   leitor que o conteúdo chegou;
	 * - `aria-label`, porque uma região viva sem nome anuncia "ocupado" sem dizer
	 *   ocupado com o quê. Daí `label` ser obrigatória.
	 *
	 * Era peça de ninguém: as cinco docs pages montavam este contêiner à mão e
	 * divergiram em cinco formas — a desta stack chegou a ficar sem
	 * `role="status"`, que é o pior caso, porque nome em elemento sem papel é
	 * atributo proibido e o axe o acusa (`aria-prohibited-attr`). Virou peça em
	 * 2026-09-13, por decisão da dona, com o mesmo contrato nas cinco stacks.
	 *
	 * UMA região por BLOCO, nunca por peça: uma lista de dez linhas é uma região
	 * com dez esqueletos dentro, senão cada linha vira uma região viva repetindo o
	 * mesmo aviso.
	 *
	 * Sem CSS próprio — a peça é fiação de acessibilidade, e o layout continua
	 * vindo das classes `.nds-*` que quem consome passa em `class`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		label,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { label: string } = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton-region"
	role="status"
	aria-busy="true"
	aria-label={label}
	class={className}
	{...restProps}
>
	{@render children?.()}
</div>
