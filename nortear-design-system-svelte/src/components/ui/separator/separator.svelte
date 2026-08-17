<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// SEM `SeparatorPrimitive.Root` do bits-ui. O primitivo não traz
	// comportamento nenhum — só escreve atributos — e escreve os ERRADOS para
	// este design system: `decorative` nasce `false` (logo o padrão sairia
	// semântico, o oposto das outras quatro stacks) e `aria-orientation` é
	// emitido SEMPRE, inclusive sob `role="none"`, onde o atributo não é
	// permitido. O `mergeProps` dele coloca o estado do primitivo à direita, o
	// que faz o valor da lib vencer o que vem de fora: não há como corrigir por
	// prop. A sonda do separator mediu os três desvios nas cinco stacks.
	//
	// Mesma decisão já tomada no Angular com o `RdxSeparatorRootDirective`, e
	// pelo mesmo motivo: compor acrescentaria dependência sem contribuição.
	// O contrato aqui é o do Vanilla, a referência cross-stack.

	type SeparatorEmphasis = "default" | "strong";

	type Props = Omit<HTMLAttributes<HTMLDivElement>, "class"> & {
		ref?: HTMLElement | null;
		class?: string;
		orientation?: "horizontal" | "vertical";
		decorative?: boolean;
		/** `strong` dobra a espessura e troca o token de cor da linha. */
		emphasis?: SeparatorEmphasis;
		"data-slot"?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		orientation = "horizontal",
		decorative = true,
		emphasis = "default",
		"data-slot": dataSlot = "separator",
		...restProps
	}: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot={dataSlot}
	data-orientation={orientation}
	data-emphasis={emphasis === "strong" ? "strong" : undefined}
	role={decorative ? "none" : "separator"}
	aria-hidden={decorative ? "true" : undefined}
	aria-orientation={decorative ? undefined : orientation}
	class={cn("nds-separator", className)}
	{...restProps}
></div>
