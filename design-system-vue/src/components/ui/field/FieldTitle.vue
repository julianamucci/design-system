<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="field-label"
    :class="cn( 'nds-field-title', props.class, )"
  >
    <slot />
  </div>
</template>
