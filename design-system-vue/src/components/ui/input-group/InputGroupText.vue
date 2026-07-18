<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    :class="cn(
      'nds-input-group-text',
      props.class,
    )"
  >
    <slot />
  </span>
</template>
