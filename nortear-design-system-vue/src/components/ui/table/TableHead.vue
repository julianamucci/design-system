<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

// `scope` nasce em "col" porque uma tabela sem ele é uma grade muda: o leitor de
// tela lê os valores sem dizer de que coluna vieram (WCAG 1.3.1). Quem tem
// cabeçalho de linha passa scope="row" e sobrescreve.
const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
}>(), {
  scope: 'col',
})
</script>

<template>
  <th
    data-slot="table-head"
    :scope="props.scope"
    :class="cn(props.class)"
  >
    <slot />
  </th>
</template>
