<script setup lang="ts">
import type { PaginationRootEmits, PaginationRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<Partial<PaginationRootProps> & {
  class?: HTMLAttributes['class']
}>()
const emits = defineEmits<PaginationRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <!--
    `role` e `aria-label` escritos aqui: o primitivo entrega a tag `nav` e mais
    nada, e o landmark saía sem nome — o leitor de tela anunciava só "navegação",
    e o axe acusa `landmark-unique` quando a página mostra a faixa mais de uma
    vez, que é exatamente o caso de uma docs page de paginação.

    Nome em português, como a documentação que o cerca. Os atributos ficam antes
    do que cai por fallthrough, então quem escrever `aria-label` no consumidor
    continua vencendo.
  -->
  <PaginationRoot
    v-slot="slotProps"
    role="navigation"
    aria-label="Paginação"
    data-slot="pagination"
    v-bind="(forwarded as any)"
    :class="cn('nds-pagination', props.class)"
  >
    <slot v-bind="slotProps" />
  </PaginationRoot>
</template>
