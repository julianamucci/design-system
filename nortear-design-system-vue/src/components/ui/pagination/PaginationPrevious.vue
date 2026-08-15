<script setup lang="ts">
import type { PaginationPrevProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { PaginationPrev, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<PaginationPrevProps & {
  size?: ButtonVariants['size']
  /** Texto visível do controle. Traduzível — o mesmo nome de prop das outras stacks. */
  text?: string
  class?: HTMLAttributes['class']
}>(), {
  size: 'default',
  text: 'Anterior',
})

const delegatedProps = reactiveOmit(props, 'class', 'size', 'text')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <!--
    `nds-pagination-prev` é a classe do design system que dá o recuo assimétrico
    do lado do ícone. No lugar dela havia `pl-1.5!`, do framework utilitário que
    saiu: classe inerte, e o recuo nunca chegou à tela.
  -->
  <PaginationPrev
    aria-label="Ir para a página anterior"
    data-slot="pagination-previous"
    :class="cn(buttonVariants({ variant: 'ghost', size }), 'nds-pagination-prev', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <ChevronLeftIcon data-icon="inline-start" />
      <span class="nds-pagination-label">{{ text }}</span>
    </slot>
  </PaginationPrev>
</template>
