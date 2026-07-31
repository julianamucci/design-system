<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * Nível do heading do título. Default `h5`. Passe o nível que preserva a
   * hierarquia de headings da página onde o Alert está (ex.: `h3` sob uma
   * seção `h2`).
   */
  as?: string
}>()
</script>

<template>
  <component
    :is="props.as ?? 'h5'"
    data-slot="alert-title"
    :class="cn('nds-alert-title', props.class)"
  >
    <slot />
  </component>
</template>
