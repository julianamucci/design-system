<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="combobox-chips"
    :class="cn('nds-combobox-chips', props.class)"
  >
    <slot />
  </div>
</template>
