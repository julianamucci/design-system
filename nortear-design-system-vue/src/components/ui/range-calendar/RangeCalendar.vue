<script lang="ts" setup>
import type { DateValue, RangeCalendarRootEmits, RangeCalendarRootProps } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import { reactiveOmit, useVModel } from '@vueuse/core'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { RangeCalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { toDate } from 'reka-ui/date'
import { computed, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import { calendarLabels } from '@shared/primitives/calendar-labels'
import { teclaTarget, gridDay, isoDoElemento } from '@shared/primitives/calendar-teclado'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNextButton, RangeCalendarPrevButton } from './index'

const props = withDefaults(defineProps<RangeCalendarRootProps & { class?: HTMLAttributes['class'] }>(), {
  // A lib abrevia em UMA letra por padrão ('narrow'), e em pt-BR isso dá
  // 'D S T Q Q S S' — duas quartas e duas quintas indistinguíveis. O calendário
  // de data única já tinha sido corrigido; este era o gêmeo que ficou para trás.
  weekdayFormat: 'short',
})

const emits = defineEmits<RangeCalendarRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'placeholder')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// A visão precisa ser escrita daqui para o teclado poder virar o mês; sem um
// ref local só dava para lê-la. Mesmo arranjo do calendário de data única.
const placeholder = useVModel(props, 'placeholder', emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? today(getLocalTimeZone()),
}) as Ref<DateValue>

/* v8 ignore next -- o idioma vem sempre de quem monta o calendário; o 'en' é
   rede de segurança para uso sem prop, que nenhuma story representa. */
const formatter = useDateFormatter(props.locale ?? 'en')

// Os botões de mês só têm ícone: quem usa leitor de tela ouve o aria-label, e o
// da lib vinha "Previous page" — em inglês e descrevendo página, não mês.
const rotulos = computed(() => calendarLabels(props.locale))

/**
 * O resto do teclado da grade — `Home`, `End`, `PageUp`, `PageDown`.
 *
 * Gêmeo do que existe no calendário de data única, e pela mesma razão: a lib
 * trata seta, Enter e Espaço, e as outras quatro teclas não chegavam a lugar
 * nenhum apesar de o conteúdo compartilhado prometê-las.
 */
function onGridKeyDown(evento: KeyboardEvent) {
  const raiz = evento.currentTarget as HTMLElement | null
  const destination = teclaTarget(isoDoElemento(evento.target as Element | null), evento)
  if (!destination || !raiz) return
  evento.preventDefault()
  placeholder.value = parseDate(destination)
  void nextTick(() => gridDay(raiz, destination)?.focus())
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    v-model:placeholder="placeholder"
    data-slot="range-calendar"
    :class="cn('nds-calendar-root nds-calendar-range', props.class)"
    v-bind="forwarded"
    @keydown="onGridKeyDown"
  >
    <!-- Mesma árvore do Vanilla: a faixa de navegação é irmã dos meses e fica
         por cima deles, e cada mês traz a própria legenda no meio. -->
    <div class="nds-calendar-months">
      <!-- Mesma classe do calendário de data única: é ela que prende os botões
           nas pontas e deixa a legenda centralizada. Com `.nds-calendar-nav`,
           que é a família de classes antiga do Vanilla, o cabeçalho do intervalo
           montava de um jeito e o da data única de outro. -->
      <div class="nds-calendar-nav-overlay">
        <RangeCalendarPrevButton :aria-label="rotulos.mesAnterior" />
        <RangeCalendarNextButton :aria-label="rotulos.proximoMes" />
      </div>

      <div
        v-for="month in grid"
        :key="month.value.toString()"
        class="nds-calendar-month"
      >
        <RangeCalendarHeader>
          <!-- Mês e ano formatados SEPARADAMENTE e juntados por espaço: em pt-BR
               e es o Intl com month+year devolve "abril de 2026", e as outras
               stacks compõem "abril 2026". -->
          <RangeCalendarHeading>
            {{ formatter.custom(toDate(month.value), { month: 'long' }) }}
            {{ formatter.custom(toDate(month.value), { year: 'numeric' }) }}
          </RangeCalendarHeading>
        </RangeCalendarHeader>

        <RangeCalendarGrid
          :aria-label="`${formatter.custom(toDate(month.value), { month: 'long' })} ${formatter.custom(toDate(month.value), { year: 'numeric' })}`"
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
    </div>
  </RangeCalendarRoot>
</template>
