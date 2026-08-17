<script lang="ts" setup>
import type { RangeCalendarCellTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarCellTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<RangeCalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'button',
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <!-- Sem compor `.nds-button .nds-button-ghost` por fora: `.nds-calendar-day-btn`
       é auto-suficiente por contrato. A lib marca o dia escolhido com
       `aria-pressed`, e `.dark .nds-button-ghost[aria-pressed="true"]` vence a
       regra do calendário por especificidade — no tema ESCURO as pontas do
       intervalo perdiam o fundo `--primary` e ficavam em 1.18:1, invisíveis. -->
  <RangeCalendarCellTrigger
    data-slot="range-calendar-trigger"
    :class="cn('nds-calendar-day-btn', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </RangeCalendarCellTrigger>
</template>
