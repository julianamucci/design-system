<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="table-container"
    class="nds-table-wrapper"
  >
    <table
      data-slot="table"
      :class="cn('nds-table', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
