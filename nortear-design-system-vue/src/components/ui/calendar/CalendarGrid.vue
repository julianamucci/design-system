<script lang="ts" setup>
import type { CalendarGridProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarGrid, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<CalendarGridProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <!-- role="grid" explícito: a lib marca a tabela como `application`, e aí as
       células com role="gridcell" ficam órfãs — gridcell só existe dentro de um
       grid. O leitor de tela deixava de oferecer a navegação bidimensional e o
       calendário virava uma tabela qualquer. As outras stacks usam grid. -->
  <CalendarGrid
    role="grid"
    data-slot="calendar-grid"
    :class="cn('nds-calendar-table', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarGrid>
</template>
