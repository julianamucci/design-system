<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Label
    data-slot="field-label"
    :class="cn(
      'nds-field-label',
      '',
      props.class,
    )"
  >
    <slot />
  </Label>
</template>
