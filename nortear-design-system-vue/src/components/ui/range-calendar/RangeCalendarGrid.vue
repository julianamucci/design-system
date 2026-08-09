<script lang="ts" setup>
import type { RangeCalendarGridProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarGrid, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<RangeCalendarGridProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <!-- role="grid" explícito, como no calendário de data única: a lib marca a
       tabela como `application`, e aí as células com role="gridcell" ficam
       órfãs — gridcell só existe dentro de um grid. Sem isto o leitor de tela
       não oferece a navegação bidimensional. -->
  <RangeCalendarGrid
    role="grid"
    data-slot="range-calendar-grid"
    :class="cn('nds-calendar-table', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </RangeCalendarGrid>
</template>
