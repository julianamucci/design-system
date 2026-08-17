<script lang="ts" setup>
import type { CalendarHeadCellProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarHeadCell, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<CalendarHeadCellProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <!-- `scope="col"`: a lib devolve um <th> sem escopo, e um <th> sem escopo é
       cabeçalho de nada. As outras stacks o declaram; esta ficava de fora. -->
  <CalendarHeadCell
    data-slot="calendar-head-cell"
    scope="col"
    :class="cn('nds-calendar-weekday', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarHeadCell>
</template>
