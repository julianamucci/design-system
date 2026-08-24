<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="combobox-popup"
    :class="cn('nds-combobox-popup', props.class)"
  >
    <slot />
  </div>
</template>
