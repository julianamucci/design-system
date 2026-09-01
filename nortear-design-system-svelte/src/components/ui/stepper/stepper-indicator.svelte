<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { getStepperItemContext } from "./stepper-context.js";

	/**
	 * Círculo numerado.
	 *
	 * `aria-hidden` porque o número repete a posição que a `<ol>` já anuncia —
	 * ler os dois faz o leitor de tela dizer a mesma coisa duas vezes.
	 *
	 * A marca de verificação da etapa concluída é FORMA, não matiz: sobrevive a
	 * daltonismo e a tela monocromática. Quem não a vê ouve a palavra de estado
	 * que o gatilho carrega em `.nds-sr-only`.
	 *
	 * Com conteúdo próprio o indicador vira `data-custom` e a resolução para de
	 * escrevê-lo — senão a marca apagaria o ícone que o consumidor pôs ali.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> = $props();

	const item = getStepperItemContext();
</script>

<span
	bind:this={ref}
	{...restProps}
	data-slot="stepper-indicator"
	data-custom={children ? "" : undefined}
	aria-hidden="true"
	class={cn("nds-stepper-indicator", className)}
>
	{#if children}
		{@render children()}
	{:else if item.state === "completed"}
		<CheckIcon class="nds-icon" aria-hidden="true" />
	{:else}
		{item.step}
	{/if}
</span>
