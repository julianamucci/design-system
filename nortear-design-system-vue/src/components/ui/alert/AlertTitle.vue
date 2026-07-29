<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h5
    data-slot="alert-title"
    :class="cn('nds-alert-title', props.class)"
  >
    <slot />
  </h5>
</template>
