<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Palavra ou ícone dentro do addon, em cor de apoio. Decoração, sem foco.
 *
 * Correção: faltava o `data-slot`. Sem ele, esta peça era a única da família
 * invisível a qualquer consulta por slot — em asserção de story, em ferramenta
 * de inspeção e em quem compõe por cima.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    data-slot="input-group-text"
    :class="cn('nds-input-group-text', props.class)"
  >
    <slot />
  </span>
</template>
