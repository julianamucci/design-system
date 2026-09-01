<script lang="ts">
	import type { HTMLLiAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import {
		getStepperRootContext,
		resolveStepperState,
		setStepperItemContext,
		type StepperState,
	} from "./stepper-context.js";

	/**
	 * Uma etapa.
	 *
	 * O estado é DERIVADO, não escrito à mão: a etapa compara o próprio número
	 * com o valor do fluxo e chega sozinha a concluída, atual ou ainda não
	 * alcançada. `completed` explícito existe só para o fluxo que aceita ordem
	 * fora do comum.
	 *
	 * `data-state` e `data-disabled` moram AQUI porque é deles que a folha
	 * alcança o indicador e o traço sem regra extra.
	 */

	let {
		ref = $bindable(null),
		step,
		completed = false,
		disabled = false,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLLiAttributes, HTMLLIElement> & {
		/** Número desta etapa, contando de 1. */
		step: number;
		/** Conta como concluída mesmo estando depois da atual. */
		completed?: boolean;
		/** Indisponível: o gatilho sai da ordem de tabulação. */
		disabled?: boolean;
	} = $props();

	const root = getStepperRootContext();

	const state: StepperState = $derived(resolveStepperState(step, root.value, completed));

	setStepperItemContext({
		get step() {
			return step;
		},
		get state() {
			return state;
		},
		get disabled() {
			return disabled;
		},
	});
</script>

<li
	bind:this={ref}
	{...restProps}
	data-slot="stepper-item"
	data-step={step}
	data-state={state}
	data-completed={completed ? "" : undefined}
	data-disabled={disabled ? "" : undefined}
	class={cn("nds-stepper-item", className)}
>
	{@render children?.()}
</li>
