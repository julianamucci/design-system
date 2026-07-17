<script setup lang="ts">
import type { WithClassAsProps } from './interface'
import { cn } from '@/lib/utils'
import { useCarousel } from './useCarousel'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<WithClassAsProps>()

const { carouselRef, orientation } = useCarousel()
</script>

<template>
  <div
    ref="carouselRef"
    data-slot="carousel-content"
    class="nds-carousel-overflow"
  >
    <div
      :class="cn('nds-carousel-track', props.class)"
      :data-orientation="orientation"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </div>
</template>
