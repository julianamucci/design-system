<script lang="ts">
	import {
		type CarouselAPI,
		type CarouselProps,
		type EmblaContext,
		setEmblaContext,
	} from "./context.js";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { marcarSlideCurrent } from "@shared/primitives/carousel-active-slide";

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
		// Direto no DOM, e não por estado reativo: os slides vêm do snippet de
		// quem consome o componente, então não há por onde passar uma prop até
		// eles. O motor já mantém a lista de nós, e é a mesma que ele move.
		marcarSlideCurrent(carouselState.api.slideNodes(), carouselState.selectedIndex);
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
		// `reInit` também: as outras stacks já o assinavam, e é o evento que o
		// motor emite quando a lista de slides muda. Sem ele, um slide entrando
		// ou saindo deixava o estado do slide atual apontando para o índice
		// antigo — e agora é ele que decide qual slide fica em tamanho cheio.
		carouselState.api.on("reInit", onSelect);
		onSelect();
	}

	$effect(() => {
		return () => {
			carouselState.api?.off("select", onSelect);
			carouselState.api?.off("reInit", onSelect);
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
