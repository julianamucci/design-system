<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * Elemento a renderizar. Default `div` (neutro, sem forçar hierarquia de
   * headings). Passe `h2`..`h6` quando o título do card for um heading real
   * na hierarquia da página.
   */
  as?: string
}>()
</script>

<template>
  <component
    :is="props.as ?? 'div'"
    data-slot="card-title"
    :class="cn('nds-card-title', props.class)"
  >
    <slot />
  </component>
</template>
