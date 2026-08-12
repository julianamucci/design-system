<script lang="ts">
	import {
		type CarouselAPI,
		type CarouselProps,
		type EmblaContext,
		setEmblaContext,
	} from "./context.js";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		opts = {},
		plugins = [],
		setApi = () => {},
		orientation = "horizontal",
		class: className,
		children,
		...restProps
	}: WithElementRef<CarouselProps> = $props();

	// svelte-ignore state_referenced_locally
	let carouselState = $state<EmblaContext>({
		api: undefined,
		scrollPrev,
		scrollNext,
		orientation,
		canScrollNext: false,
		canScrollPrev: false,
		handleKeyDown,
		options: opts,
		plugins,
		onInit,
		scrollSnaps: [],
		selectedIndex: 0,
		scrollTo,
	});

	setEmblaContext(carouselState);

	function scrollPrev() {
		carouselState.api?.scrollPrev();
	}

	function scrollNext() {
		carouselState.api?.scrollNext();
	}

	function scrollTo(index: number, jump?: boolean) {
		carouselState.api?.scrollTo(index, jump);
	}

	function onSelect() {
		if (!carouselState.api) return;
		carouselState.selectedIndex = carouselState.api.selectedScrollSnap();
		carouselState.canScrollNext = carouselState.api.canScrollNext();
		carouselState.canScrollPrev = carouselState.api.canScrollPrev();
	}

	function handleKeyDown(e: KeyboardEvent) {
		// O par de teclas acompanha o EIXO. Um carrossel vertical que só responde
		// a ArrowLeft/ArrowRight obriga quem navega por teclado a apertar a seta
		// que aponta para o lado errado — e as setas naturais não fazem nada, sem
		// erro nenhum. Vanilla e Angular já trocam o par; esta stack não trocava.
		const voltar = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
		const avancar = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

		if (e.key === voltar) {
			e.preventDefault();
			scrollPrev();
		} else if (e.key === avancar) {
			e.preventDefault();
			scrollNext();
		}
	}

	function onInit(event: CustomEvent<CarouselAPI>) {
		carouselState.api = event.detail;
		setApi(carouselState.api);

		carouselState.scrollSnaps = carouselState.api.scrollSnapList();
		carouselState.api.on("select", onSelect);
		onSelect();
	}

	$effect(() => {
		return () => {
			carouselState.api?.off("select", onSelect);
		};
	});
</script>

<div
	bind:this={ref}
	data-slot="carousel"
	class={cn("nds-carousel", className)}
	role="region"
	aria-roledescription="carousel"
	{...restProps}
>
	{@render children?.()}
</div>
