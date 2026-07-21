<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'
import TableCell from './TableCell.vue'
import TableRow from './TableRow.vue'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  colspan?: number
}>(), {
  colspan: 1,
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <TableRow>
    <TableCell
      :class="cn( 'nds-data-table-empty', props.class, )"
      v-bind="delegatedProps"
    >
      <div class="nds-cluster" data-justify="center" data-align="center" style="padding-block: 2.5rem">
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>
