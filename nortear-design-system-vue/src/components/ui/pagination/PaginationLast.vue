<script setup lang="ts">
import type { PaginationLastProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { ChevronsRightIcon } from 'lucide-vue-next'
import { PaginationLast, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<PaginationLastProps & {
  size?: ButtonVariants['size']
  /** Texto visível do controle. Vazio por padrão — ver a nota em PaginationFirst.vue. */
  text?: string
  /** Aparência do controle. Padrão `ghost` — ver a nota em PaginationLink.vue. */
  appearance?: 'ghost' | 'outline'
  class?: HTMLAttributes['class']
}>(), {
  size: 'default',
  text: '',
  appearance: 'ghost',
})

const delegatedProps = reactiveOmit(props, 'class', 'size', 'text', 'appearance')
const forwarded = useForwardProps(delegatedProps)

/** Sem texto visível o controle é quadrado — ver a nota em PaginationPrevious.vue. */
const iconOnly = computed(() => !props.text)

const classes = computed(() => cn(
  buttonVariants({ variant: props.appearance, size: iconOnly.value ? 'icon' : props.size }),
  iconOnly.value ? undefined : 'nds-pagination-next',
  props.class,
))
</script>

<template>
  <!-- Salto para a última página — o espelho de PaginationFirst.vue. -->
  <PaginationLast
    aria-label="Ir para a última página"
    data-slot="pagination-last"
    :class="classes"
    v-bind="forwarded"
  >
    <slot>
      <span
        v-if="!iconOnly"
        class="nds-pagination-label"
      >{{ text }}</span>
      <ChevronsRightIcon data-icon="inline-end" />
    </slot>
  </PaginationLast>
</template>
