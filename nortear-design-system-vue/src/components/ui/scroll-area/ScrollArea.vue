<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline — 60 alturas cravadas, 20 valores distintos para dizer a mesma coisa.
// Altura fora da escada continua possível pela custom property `--box-height`,
// que a folha governa.
type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = defineProps<ScrollAreaRootProps & {
  class?: HTMLAttributes['class']
  size?: ScrollAreaSize
}>()

const delegatedProps = reactiveOmit(props, 'class', 'size')
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    :data-size="size"
    v-bind="delegatedProps"
    :class="cn('nds-scroll-area', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      tabindex="0"
      class="nds-scroll-area-viewport"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
