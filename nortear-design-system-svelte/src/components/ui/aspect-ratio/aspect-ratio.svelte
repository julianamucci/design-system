<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	// ─── AspectRatio ──────────────────────────────────────────────────────────
	//
	// SEM o primitivo do bits-ui, pela mesma razão que o Angular dispensa o
	// `RdxAspectRatioDirective`: ele resolve o problema por outro mecanismo. O
	// bits-ui envolve o conteúdo num wrapper extra com
	// `padding-bottom: <porcentagem>` — o truque anterior ao `aspect-ratio`
	// nativo — e não emite classe nenhuma. O resultado era um componente que
	// produzia a caixa certa e ficava FORA da folha compartilhada:
	// `.nds-aspect-ratio` não existia no DOM, `--ratio` não existia, e a regra
	// `.nds-aspect-ratio > *` (que estica o filho para cobrir a caixa) não se
	// aplicava. Medido: um filho sem altura própria ficava 126px mais curto que
	// o container, enquanto nas outras stacks preenchia.
	//
	// Aqui o elemento é nativo e alimenta a custom property que
	// `docs/shared/styles/nds/aspect-ratio.css` lê. A prop pública (`ratio`) não
	// muda.

	let {
		ref = $bindable(null),
		class: className,
		/** Proporção largura/altura. Ex.: `16/9`, `4/3`, `1`. Default `1` (quadrado). */
		ratio = 1,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { ratio?: number } = $props();

	// `--ratio` vem PRIMEIRO para que um `style` do consumidor possa sobrescrevê-lo
	// de propósito, e não por acidente de ordem de atributos.
	const estilo = $derived(`--ratio: ${ratio};${style ? ` ${style}` : ""}`);
</script>

<div
	bind:this={ref}
	data-slot="aspect-ratio"
	class={cn("nds-aspect-ratio", className)}
	style={estilo}
	{...restProps}
>
	{@render children?.()}
</div>
