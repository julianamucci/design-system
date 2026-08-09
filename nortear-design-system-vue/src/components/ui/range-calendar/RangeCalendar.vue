<script lang="ts" setup>
import type { RangeCalendarRootEmits, RangeCalendarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { toDate } from 'reka-ui/date'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { rotulosDoCalendario } from '@shared/primitives/calendar-labels'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNextButton, RangeCalendarPrevButton } from './index'

const props = withDefaults(defineProps<RangeCalendarRootProps & { class?: HTMLAttributes['class'] }>(), {
  // A lib abrevia em UMA letra por padrão ('narrow'), e em pt-BR isso dá
  // 'D S T Q Q S S' — duas quartas e duas quintas indistinguíveis. O calendário
  // de data única já tinha sido corrigido; este era o gêmeo que ficou para trás.
  weekdayFormat: 'short',
})

const emits = defineEmits<RangeCalendarRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/* v8 ignore next -- o idioma vem sempre de quem monta o calendário; o 'en' é
   rede de segurança para uso sem prop, que nenhuma story representa. */
const formatter = useDateFormatter(props.locale ?? 'en')

// Os botões de mês só têm ícone: quem usa leitor de tela ouve o aria-label, e o
// da lib vinha "Previous page" — em inglês e descrevendo página, não mês.
const rotulos = computed(() => rotulosDoCalendario(props.locale))
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays, date }"
    data-slot="range-calendar"
    :class="cn('nds-calendar-root nds-calendar-range', props.class)"
    v-bind="forwarded"
  >
    <RangeCalendarHeader>
      <!-- Mês e ano formatados SEPARADAMENTE e juntados por espaço: em pt-BR e
           es o Intl com month+year devolve "abril de 2026", e as outras três
           stacks compõem "abril 2026". -->
      <RangeCalendarHeading>
        {{ formatter.custom(toDate(date), { month: 'long' }) }}
        {{ formatter.custom(toDate(date), { year: 'numeric' }) }}
      </RangeCalendarHeading>

      <!-- Mesma classe do calendário de data única: é ela que prende os botões
           nas pontas e deixa a legenda centralizada. Com `.nds-calendar-nav`,
           que é a família de classes do Vanilla, o cabeçalho do intervalo
           montava de um jeito e o da data única de outro. -->
      <div class="nds-calendar-nav-overlay">
        <RangeCalendarPrevButton :aria-label="rotulos.mesAnterior" />
        <RangeCalendarNextButton :aria-label="rotulos.proximoMes" />
      </div>
    </RangeCalendarHeader>

    <div class="nds-calendar-months">
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell
              v-for="day in weekDays"
              :key="day"
            >
              {{ day.replace(/\.$/, '') }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="nds-calendar-week"
          >
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <RangeCalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
