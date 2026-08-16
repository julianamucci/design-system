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
    <!-- `nds-table-empty`, e não a regra homônima do DataTable: são dois slugs,
         e o empty state desta tabela é regra do `table.css`. A daqui já reserva
         a altura, centraliza e apaga a cor. -->
    <TableCell
      :class="cn('nds-table-empty', props.class)"
      v-bind="delegatedProps"
    >
      <div
        class="nds-cluster"
        data-justify="center"
        data-align="center"
      >
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>
