<script lang="ts">
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
  } from './index';
  import Autoplay from 'embla-carousel-autoplay';
  import type { CarouselAPI } from './context.js';

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
    widthClass = 'nds-w-full nds-max-w-sm',
    images = [],
  }: Props = $props();

  // API exposed via setApi — used for dots
  let api = $state<CarouselAPI | undefined>(undefined);
  let selectedIndex = $state(0);
  let scrollSnaps = $state<number[]>([]);

  function setApi(a: CarouselAPI | undefined) {
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

  // Delay curto de propósito: a story precisa ver o relógio andar dentro do
  // orçamento de um `waitFor`, e um intervalo de segundos deixaria o teste
  // esperando à toa (ou passando por acaso, quando o runner atrasa).
  const plugins = $derived(
    variant === 'autoplay'
      ? [Autoplay({ delay: 400, stopOnInteraction: true })]
      : []
  );

  const emblaOpts = $derived({
    loop: variant === 'autoplay' ? true : loop,
    startIndex,
  });

  const vertical = $derived(orientation === 'vertical' || variant === 'vertical');

  const defaultBasis = $derived(
    variant === 'multi' ? 'nds-md-basis-half nds-lg-basis-third' : ''
  );

  const effectiveBasis = $derived(itemBasis || defaultBasis);

  // Na vertical a pilha precisa de altura DEFINIDA: sem ela a base
  // `flex: 0 0 100%` do slide não tem contra o que resolver e o carrossel
  // cresce em vez de recortar. A classe do `CarouselContent` pousa no TRILHO —
  // é ele que dá a altura, e o viewport (`overflow: hidden`) a acompanha. Vem
  // de uma classe de proporção, nunca de `style`: inline venceria a folha e
  // sairia do tema, da densidade e da escala.
  const trackClass = $derived(vertical ? heightClass || 'nds-aspect-4-3' : heightClass);
</script>

<div class={widthClass}>
  <Carousel
    opts={emblaOpts}
    plugins={plugins}
    orientation={vertical ? 'vertical' : 'horizontal'}
    setApi={setApi}
    aria-label={ariaLabel}
  >
    <CarouselContent class={trackClass}>
      {#each slides as slide, i (i)}
        <CarouselItem
          class={effectiveBasis}
          aria-label={`${slideLabel} ${i + 1} ${ofLabel} ${slides.length}`}
        >
          {#if variant === 'gallery' && slide.src}
            <div class="nds-p-1">
              <img
                src={slide.src}
                alt={slide.alt}
                loading="lazy"
                decoding="async"
                class="nds-aspect-16-9 nds-w-full nds-rounded-lg nds-bg-muted-soft" style="object-fit: cover"
              />
            </div>
          {:else}
            <!--
              Mesma árvore que React, Angular e Vanilla montam: proporção 16:9
              por fora, caixa `muted-soft` arredondada por dentro, e o rótulo
              inteiro em vez de só o número. Esta stack era a última divergente —
              usava quadrado, `bg-muted` cheio e o número solto, então a mesma
              demonstração aparecia diferente em cada Storybook.

              O `nds-p-1` saiu: `.nds-carousel-slide` já traz `padding-left` de
              16px, e o embrulho duplicava o respiro só aqui.
            -->
            <div class:nds-h-full={vertical}>
              <div
                class="nds-cluster nds-rounded-lg nds-bg-muted-soft nds-text-h3 nds-font-semibold nds-text-muted-foreground" style="user-select: none"
                class:nds-aspect-16-9={!vertical}
                class:nds-h-full={vertical}
                data-align="center"
                data-justify="center"
              >
                {slideLabel} {i + 1}
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
    <div class="nds-cluster nds-mt-4" data-align="center" data-justify="center" data-spacing="sm">
      {#each scrollSnaps as _, i (i)}
        <!--
          Botão comum, não aba: o controle não comanda um painel e o conjunto
          não é um `tablist`. O conteúdo compartilhado documenta
          `aria-current="true"` no atual, que é o que um leitor de tela usa para
          dizer "atual" numa lista de atalhos. Inativo NÃO carrega o atributo —
          a string "false" ainda casaria com o seletor de presença.

          Toda a aparência mora em `.nds-carousel-dot`: o atual vira PÍLULA com
          o rótulo à vista, os demais continuam pontos, e o ALVO tem piso de
          24px nos dois estados. Desenhar o botão com os 8px da marca reprovava
          no axe por `target-size` (WCAG 2.5.8). A forma sai do próprio
          `aria-current`, então o que o leitor anuncia e o que o olho vê não têm
          como divergir.

          O rótulo mora em TODOS os controles, não só no atual: é o que deixa a
          pílula abrir e fechar por recorte em vez de o texto piscar.
        -->
        <button
          type="button"
          class="nds-carousel-dot"
          aria-label={`${goToSlideLabel} ${i + 1} ${ofLabel} ${scrollSnaps.length}`}
          aria-current={selectedIndex === i ? 'true' : undefined}
          onclick={() => goTo(i)}
        ><span class="nds-carousel-dot-label">{slideLabel} {i + 1}</span></button>
      {/each}
    </div>
  {/if}
</div>
