<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxGroupContext } from './index'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const { labelId } = useComboboxGroupContext()
</script>

<template>
  <div
    :id="labelId"
    data-slot="combobox-group-label"
    :class="cn('nds-combobox-group-label', props.class)"
  >
    <slot />
  </div>
</template>
