<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="sidebar-inset"
    :class="cn('nds-sidebar-inset', props.class)"
  >
    <slot />
  </div>
</template>
