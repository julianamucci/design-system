<script lang="ts" setup>
import type { CalendarCellTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarCellTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'button',
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// A lib dá tabindex 0 ao dia corrente e -1 aos demais do mês, mas deixa os dias
// de fora do mês SEM atributo — e um <button> sem tabindex é tabulável. Com
// isso o Tab entrava no grid pelo último dia do mês anterior, não pelo dia
// corrente, e a partir dali as setas travavam a página. O grid é uma parada de
// tabulação só: quem completa a primeira e a última semana não é destino.
const foraDoMes = computed(() => props.day.month !== props.month.month)
</script>

<template>
  <CalendarCellTrigger
    data-slot="calendar-cell-trigger"
    :tabindex="foraDoMes ? -1 : undefined"
    :class="cn( buttonVariants({ variant: 'ghost' }), 'nds-calendar-day-btn', props.class, )"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarCellTrigger>
</template>
