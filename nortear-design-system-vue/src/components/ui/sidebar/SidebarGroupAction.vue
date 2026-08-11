<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

// `as: 'button'` é obrigatório: sem o default o primitivo renderiza uma <div>,
// e a ação do grupo — que é clicável e recebe foco — deixa de ter papel de
// botão para o teclado e para o leitor de tela. Mesmo default da ação do item.
const props = withDefaults(defineProps<PrimitiveProps & {
  class?: HTMLAttributes['class']
}>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    data-slot="sidebar-group-action"
    data-sidebar="group-action"
    :as="as"
    :as-child="asChild"
    :class="cn('nds-sidebar-group-action', props.class)"
  >
    <slot />
  </Primitive>
</template>
