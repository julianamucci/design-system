import type { UnwrapRefCarouselApi as CarouselApi, CarouselEmits, CarouselProps } from './interface'
import { createInjectionState } from '@vueuse/core'
import emblaCarouselVue from 'embla-carousel-vue'
import { onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import { marcarSlideCurrent } from '@shared/primitives/carousel-active-slide'

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
  ({
    opts,
    orientation,
    plugins,
  }: CarouselProps, emits: CarouselEmits) => {
    const [emblaNode, emblaApi] = emblaCarouselVue({
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
      // O motor anima o deslize em JS, quadro a quadro — nenhuma media query
      // alcança isso, e a folha compartilhada não tem mais transição no track
      // (ela atrapalhava o gesto). Zerar a duração AQUI é o único lugar onde a
      // preferência por movimento reduzido chega ao deslize: sem isto o
      // carrossel continuava correndo com a preferência ligada.
      ...(prefersReducedMotion() ? { duration: 0 } : null),
    }, plugins)

    function scrollPrev() {
      emblaApi.value?.scrollPrev()
    }
    function scrollNext() {
      emblaApi.value?.scrollNext()
    }

    const canScrollNext = ref(false)
    const canScrollPrev = ref(false)

    function onSelect(api: CarouselApi) {
      canScrollNext.value = api?.canScrollNext() || false
      canScrollPrev.value = api?.canScrollPrev() || false
      // Direto no DOM, e não por estado reativo: os slides vêm do `slot` de
      // quem consome o componente, então não há por onde passar uma prop até
      // eles. O motor já mantém a lista de nós, e é a mesma que ele move.
      if (api) marcarSlideCurrent(api.slideNodes(), api.selectedScrollSnap())
    }

    onMounted(() => {
      if (!emblaApi.value)
        return

      emblaApi.value?.on('init', onSelect)
      emblaApi.value?.on('reInit', onSelect)
      emblaApi.value?.on('select', onSelect)

      emits('init-api', emblaApi.value)
    })

    return { carouselRef: emblaNode, carouselApi: emblaApi, canScrollPrev, canScrollNext, scrollPrev, scrollNext, orientation }
  },
)

function useCarousel() {
  const carouselState = useInjectCarousel()

  if (!carouselState)
    throw new Error('useCarousel must be used within a <Carousel />')

  return carouselState
}

export { useCarousel, useProvideCarousel }
