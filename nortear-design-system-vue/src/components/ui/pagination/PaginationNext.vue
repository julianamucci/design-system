<script setup lang="ts">
import type { PaginationNextProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { ChevronRightIcon } from 'lucide-vue-next'
import { PaginationNext, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<PaginationNextProps & {
  size?: ButtonVariants['size']
  /** Texto visível do controle. Traduzível — o mesmo nome de prop das outras stacks. */
  text?: string
  class?: HTMLAttributes['class']
}>(), {
  size: 'default',
  text: 'Próxima',
})

const delegatedProps = reactiveOmit(props, 'class', 'size', 'text')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <!-- `nds-pagination-next` no lugar de `pr-1.5!` — ver a nota em PaginationPrevious.vue. -->
  <PaginationNext
    aria-label="Ir para a próxima página"
    data-slot="pagination-next"
    :class="cn(buttonVariants({ variant: 'ghost', size }), 'nds-pagination-next', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <span class="nds-pagination-label">{{ text }}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </slot>
  </PaginationNext>
</template>
