<script lang="ts">
	import emblaCarouselSvelte from "embla-carousel-svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getEmblaContext } from "./context.js";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { prefersReducedMotion } from "@/lib/motion";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	const emblaCtx = getEmblaContext("<Carousel.Content/>");
</script>

<div
	data-slot="carousel-content"
	class="nds-carousel-overflow"
	use:emblaCarouselSvelte={{
		options: {
			container: "[data-embla-container]",
			slides: "[data-embla-slide]",
			...emblaCtx.options,
			axis: emblaCtx.orientation === "horizontal" ? "x" : "y",
			// O motor anima o deslize em JS, quadro a quadro — nenhuma media
			// query alcança isso, e a folha compartilhada não tem mais transição
			// no track (ela atrapalhava o gesto). Zerar a duração AQUI é o único
			// lugar onde a preferência por movimento reduzido chega ao deslize:
			// sem isto o carrossel continuava correndo com a preferência ligada.
			...(prefersReducedMotion() ? { duration: 0 } : null),
		},
		plugins: emblaCtx.plugins,
	}}
	onemblaInit={emblaCtx.onInit}
>
	<div
		bind:this={ref}
		class={cn(
			"nds-carousel-track",
			className
		)}
		data-embla-container=""
		data-orientation={emblaCtx.orientation}
		{...restProps}
	>
		{@render children?.()}
	</div>
</div>
