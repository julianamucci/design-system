<script setup lang="ts">
import type { PaginationFirstProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { ChevronsLeftIcon } from 'lucide-vue-next'
import { PaginationFirst, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<PaginationFirstProps & {
  size?: ButtonVariants['size']
  /**
   * Texto visível do controle. Vazio por padrão: o salto vive nas PONTAS da
   * faixa, onde o espaço é do ícone, e o duplo chevron já diz "vai até o fim".
   */
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
  iconOnly.value ? undefined : 'nds-pagination-prev',
  props.class,
))
</script>

<template>
  <!--
    Salto para a primeira página. O DUPLO chevron é o que o separa do "anterior"
    ao lado: um passo contra uma ida até a ponta.

    Quem desabilita no extremo é o primitivo, lendo `:page` contra `:total` e
    `:items-per-page` — não há prop de desabilitado, e escrever uma ensinaria a
    duplicar o que o componente já calcula.
  -->
  <PaginationFirst
    aria-label="Ir para a primeira página"
    data-slot="pagination-first"
    :class="classes"
    v-bind="forwarded"
  >
    <slot>
      <ChevronsLeftIcon data-icon="inline-start" />
      <span
        v-if="!iconOnly"
        class="nds-pagination-label"
      >{{ text }}</span>
    </slot>
  </PaginationFirst>
</template>
