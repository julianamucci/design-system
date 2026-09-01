<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { getStepperItemContext, getStepperRootContext } from "./stepper-context.js";

	/**
	 * Controle da etapa.
	 *
	 * `type="button"` explícito: dentro de um `<form>` — que é o caso de todo
	 * wizard — um botão sem `type` é `submit`, e clicar numa etapa enviaria o
	 * formulário.
	 *
	 * O `<span class="nds-sr-only">` existe SEMPRE, mesmo vazio, e a palavra vem
	 * dos rótulos da RAIZ. É isso que mantém o anúncio correto quando o fluxo
	 * avança: a mesma etapa que hoje é a atual amanhã está concluída, e uma
	 * palavra fixa por gatilho estaria errada no passo seguinte.
	 *
	 * Só a etapa atual carrega `aria-current`. Deixar o atributo para trás ao
	 * avançar daria DOIS "atual" na mesma lista, que é pior do que nenhum.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		onclick,
		...restProps
	}: WithElementRef<HTMLButtonAttributes, HTMLButtonElement> = $props();

	const root = getStepperRootContext();
	const item = getStepperItemContext();

	const stateWord = $derived(
		item.state === "completed"
			? (root.labels.completed ?? "")
			: item.state === "active"
				? (root.labels.current ?? "")
				: "",
	);

	function handleClick(
		event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
	): void {
		onclick?.(event);
		// O manipulador do consumidor roda primeiro e pode cancelar a seleção —
		// o inverso obrigaria quem consome a desfazer o que já aconteceu.
		if (event.defaultPrevented) return;
		root.select(item.step);
	}
</script>

<button
	bind:this={ref}
	{...restProps}
	type="button"
	data-slot="stepper-trigger"
	aria-current={item.state === "active" ? "step" : undefined}
	disabled={item.disabled}
	class={cn("nds-stepper-trigger", className)}
	onclick={handleClick}
>
	<span class="nds-sr-only" data-slot="stepper-state-label">{stateWord}</span>
	{@render children?.()}
</button>
