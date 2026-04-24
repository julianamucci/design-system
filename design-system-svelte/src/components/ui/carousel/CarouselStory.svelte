<script lang="ts">
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
  } from './index';
  import Autoplay from 'embla-carousel-autoplay';

  type Variant = 'single' | 'multi' | 'autoplay' | 'vertical' | 'gallery' | 'withDots';
  type Orientation = 'horizontal' | 'vertical';

  interface Props {
    variant?: Variant;
    orientation?: Orientation;
    loop?: boolean;
    startIndex?: number;
    slideCount?: number;
    itemBasis?: string;
    ariaLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    goToSlideLabel?: string;
    slideLabel?: string;
    ofLabel?: string;
    heightClass?: string;
    widthClass?: string;
    images?: { src: string; alt: string }[];
  }

  let {
    variant = 'single',
    orientation = 'horizontal',
    loop = false,
    startIndex = 0,
    slideCount = 5,
    itemBasis = '',
    ariaLabel = 'Galeria de exemplos',
    previousLabel = 'Item anterior',
    nextLabel = 'Próximo item',
    goToSlideLabel = 'Ir para o slide',
    slideLabel = 'Slide',
    ofLabel = 'de',
    heightClass = '',
    widthClass = 'w-full max-w-sm',
    images = [],
  }: Props = $props();

  // API exposed via setApi — used for dots
  let api = $state<any>(undefined);
  let selectedIndex = $state(0);
  let scrollSnaps = $state<number[]>([]);

  function setApi(a: any) {
    api = a;
    if (!a) return;
    scrollSnaps = a.scrollSnapList();
    selectedIndex = a.selectedScrollSnap();
    a.on('select', () => {
      selectedIndex = a.selectedScrollSnap();
    });
    a.on('reInit', () => {
      scrollSnaps = a.scrollSnapList();
      selectedIndex = a.selectedScrollSnap();
    });
  }

  function goTo(i: number) {
    api?.scrollTo(i);
  }

  const slides = $derived(
    variant === 'gallery' && images.length > 0
      ? images
      : Array.from({ length: slideCount }, (_, i) => ({
          src: '',
          alt: `${slideLabel} ${i + 1}`,
          index: i + 1,
        }))
  );

  const plugins = $derived(
    variant === 'autoplay'
      ? [Autoplay({ delay: 3000, stopOnInteraction: true })]
      : []
  );

  const emblaOpts = $derived({
    loop: variant === 'autoplay' ? true : loop,
    startIndex,
  });

  const defaultBasis = $derived(
    variant === 'multi'
      ? 'md:basis-1/2 lg:basis-1/3'
      : variant === 'vertical'
        ? ''
        : ''
  );

  const effectiveBasis = $derived(itemBasis || defaultBasis);

  const containerClass = $derived(
    orientation === 'vertical' || variant === 'vertical'
      ? `${widthClass} ${heightClass || 'h-[260px]'}`
      : widthClass
  );
</script>

<div class={containerClass}>
  <Carousel
    opts={emblaOpts}
    plugins={plugins}
    orientation={variant === 'vertical' ? 'vertical' : orientation}
    setApi={setApi}
    aria-label={ariaLabel}
    class="relative"
  >
    <CarouselContent class={variant === 'vertical' ? 'h-[260px]' : ''}>
      {#each slides as slide, i}
        <CarouselItem class={effectiveBasis}>
          {#if variant === 'gallery' && slide.src}
            <div class="p-1">
              <img
                src={slide.src}
                alt={slide.alt}
                loading="lazy"
                decoding="async"
                class="aspect-square w-full object-cover rounded-md bg-muted"
              />
            </div>
          {:else}
            <div class="p-1">
              <div
                class="flex aspect-square items-center justify-center rounded-md bg-muted text-3xl font-semibold text-muted-foreground select-none"
                aria-label={`${slideLabel} ${i + 1} ${ofLabel} ${slides.length}`}
              >
                {i + 1}
              </div>
            </div>
          {/if}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label={previousLabel} />
    <CarouselNext aria-label={nextLabel} />
  </Carousel>

  {#if variant === 'withDots'}
    <div class="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Paginação do carrossel">
      {#each scrollSnaps as _, i}
        <button
          type="button"
          role="tab"
          aria-label={`${goToSlideLabel} ${i + 1}`}
          aria-selected={selectedIndex === i}
          class="h-2 w-2 rounded-full transition-colors"
          class:bg-primary={selectedIndex === i}
          class:bg-muted-foreground={selectedIndex !== i}
          class:opacity-40={selectedIndex !== i}
          onclick={() => goTo(i)}
        ></button>
      {/each}
    </div>
  {/if}
</div>
