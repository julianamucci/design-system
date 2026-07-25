<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="field-separator"
    :data-content="!!$slots.default"
    :class="cn('nds-field-separator', props.class)"
  >
    <Separator />
    <span
      v-if="$slots.default"
      class="nds-field-separator-content"
      data-slot="field-separator-content"
    >
      <slot />
    </span>
  </div>
</template>
