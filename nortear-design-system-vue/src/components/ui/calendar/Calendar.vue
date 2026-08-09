<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps, DateValue } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import type { LayoutTypes } from './index'
import { getLocalTimeZone, today } from '@internationalized/date'
import { createReusableTemplate, reactiveOmit, useVModel } from '@vueuse/core'
import { CalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { createYear, createYearRange, toDate } from 'reka-ui/date'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNextButton, CalendarPrevButton } from './index'

const props = withDefaults(defineProps<CalendarRootProps & { class?: HTMLAttributes['class'], layout?: LayoutTypes, yearRange?: DateValue[] }>(), {
  modelValue: undefined,
  layout: undefined,
  // A lib abrevia em UMA letra por padrão ('narrow'), e em pt-BR isso dá
  // 'D S T Q Q S S' — duas quartas e duas quintas indistinguíveis. As outras
  // três stacks mostram a forma curta; esta passa a mostrar também.
  weekdayFormat: 'short',
})
const emits = defineEmits<CalendarRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'layout', 'placeholder')

const placeholder = useVModel(props, 'placeholder', emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? today(getLocalTimeZone()),
}) as Ref<DateValue>

/* v8 ignore next -- o idioma vem sempre de quem monta o calendário; o 'en' é
   rede de segurança para uso sem prop, que nenhuma story representa. */
const formatter = useDateFormatter(props.locale ?? 'en')

/** Anos oferecidos para cada lado do ano em vista, como no Vanilla. */
const JANELA_DE_ANOS = 10

const yearRange = computed(() => {
  // A âncora é o `placeholder` já resolvido, e não a cadeia
  // `props.placeholder ?? defaultPlaceholder ?? today()`: o ref acima nasce com
  // valor garantido, então a cadeia era um caminho que nunca corria — e repetir
  // a resolução em dois lugares é o tipo de duplicação que diverge depois.
  const ancora = placeholder.value
  /* v8 ignore next 4 -- minValue/maxValue delimitam a navegação e são
     repassados ao CalendarRoot; aqui só apertariam a lista de anos. Nenhuma
     story os passa, e nenhum conteúdo compartilhado os documenta. */
  // Uma janela em torno do ano em vista, e não os 111 anos que a lib oferece
  // por padrão (o corrente menos 100, mais 10): aberta, aquela lista fica mais
  // alta que o calendário inteiro e obriga a rolar um século para achar o ano
  // ao lado. A janela é a mesma do Vanilla e anda junto ao navegar.
  return props.yearRange ?? createYearRange({
    start: props?.minValue ?? ancora.cycle('year', -JANELA_DE_ANOS),
    end: props?.maxValue ?? ancora.cycle('year', JANELA_DE_ANOS),
  })
})

const [DefineMonthTemplate, ReuseMonthTemplate] = createReusableTemplate<{ date: DateValue }>()
const [DefineYearTemplate, ReuseYearTemplate] = createReusableTemplate<{ date: DateValue }>()

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <!-- <select> puro, e não o NativeSelect do stack: aquele traz wrapper e
       chevron próprios, e a legenda do calendário é contrato compartilhado
       entre as quatro stacks — o mesmo `.nds-calendar-select` em todas. É a
       única exceção ao "prefira o componente existente" neste arquivo, e ela
       existe porque a consistência entre stacks é a regra mais forte aqui. -->
  <DefineMonthTemplate v-slot="{ date }">
    <select
      aria-label="Selecionar mês"
      class="nds-calendar-select"
      @change="(e: Event) => {
        placeholder = placeholder.set({
          month: Number((e?.target as HTMLSelectElement)?.value),
        })
      }"
    >
      <option
        v-for="(month) in createYear({ dateObj: date })"
        :key="month.toString()"
        :value="month.month"
        :selected="date.month === month.month"
      >
        {{ formatter.custom(toDate(month), { month: 'short' }) }}
      </option>
    </select>
  </DefineMonthTemplate>

  <DefineYearTemplate v-slot="{ date }">
    <select
      aria-label="Selecionar ano"
      class="nds-calendar-select"
      @change="(e: Event) => {
        placeholder = placeholder.set({
          year: Number((e?.target as HTMLSelectElement)?.value),
        })
      }"
    >
      <option
        v-for="(year) in yearRange"
        :key="year.toString()"
        :value="year.year"
        :selected="date.year === year.year"
      >
        {{ formatter.custom(toDate(year), { year: 'numeric' }) }}
      </option>
    </select>
  </DefineYearTemplate>

  <CalendarRoot
    v-slot="{ grid, weekDays, date }"
    v-bind="forwarded"
    v-model:placeholder="placeholder"
    data-slot="calendar"
    :class="cn('nds-calendar-root', props.class)"
  >
    <!-- `pt-0` saiu: era utilitário de uma lib que não existe mais no projeto,
         então já não aplicava nada. O espaçamento do cabeçalho vem do
         .nds-calendar-caption, igual nas outras stacks. -->
    <CalendarHeader>
      <!-- div (não <nav>): paginação de mês não é landmark de navegação — o
           <nav> sem rótulo repetia um landmark por calendário (landmark-unique);
           a referência cross-stack (vanilla) também usa div. -->
      <div class="nds-calendar-nav-overlay">
        <CalendarPrevButton>
          <slot name="calendar-prev-icon" />
        </CalendarPrevButton>
        <CalendarNextButton>
          <slot name="calendar-next-icon" />
        </CalendarNextButton>
      </div>

      <slot
        name="calendar-heading"
        :date="date"
        :month="ReuseMonthTemplate"
        :year="ReuseYearTemplate"
      >
        <template v-if="layout === 'month-and-year'">
          <div class="nds-calendar-caption-dropdown">
            <ReuseMonthTemplate :date="date" />
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else>
          <CalendarHeading />
        </template>
      </slot>
    </CalendarHeader>

    <div class="nds-calendar-months">
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
      >
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
            >
              {{ day.replace(/\.$/, '') }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="nds-calendar-week"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
