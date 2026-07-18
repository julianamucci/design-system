<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="empty-header"
    :class="cn(
      'nds-empty-header',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
