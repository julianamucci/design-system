<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <li
    data-slot="pagination-item"
    :class="cn('inline-flex', props.class)"
  >
    <slot />
  </li>
</template>
