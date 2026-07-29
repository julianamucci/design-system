<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <section
    data-slot="alert-description"
    :class="cn('nds-alert-description', props.class)"
  >
    <slot />
  </section>
</template>
