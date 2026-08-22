<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps, DateValue } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import type { LayoutTypes } from './index'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { createReusableTemplate, reactiveOmit, useVModel } from '@vueuse/core'
import { CalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { createYear, createYearRange, toDate } from 'reka-ui/date'
import { computed, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import { calendarLabels } from '@shared/primitives/calendar-labels'
import { teclaTarget, gridDay, isoDoElemento } from '@shared/primitives/calendar-teclado'
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

// Os botões de mês só têm ícone: quem usa leitor de tela ouve o aria-label, e o
// da lib vinha "Previous page" — em inglês e descrevendo página, não mês.
const rotulos = computed(() => calendarLabels(props.locale))

/**
 * Anos oferecidos para cada lado do ano corrente.
 *
 * A lista é COMPLETA, e não uma janela que anda: o painel de um <select> é
 * desenhado pelo navegador e não entrega evento de rolagem ao JS, então não há
 * onde pendurar um "carregar mais ao chegar na ponta". Uma janela obrigava a
 * escolher o último ano da lista e reabrir para andar mais. Quem limita o que
 * aparece é a altura do painel (onze itens, no CSS): abre com o ano corrente no
 * meio e rola livre para os dois lados.
 */
const EACH_SIDE_YEARS = 100

const yearRange = computed(() => {
  // A âncora é o `placeholder` já resolvido, e não a cadeia
  // `props.placeholder ?? defaultPlaceholder ?? today()`: o ref acima nasce com
  // valor garantido, então a cadeia era um caminho que nunca corria — e repetir
  // a resolução em dois lugares é o tipo de duplicação que diverge depois.
  const ancora = placeholder.value
  /* v8 ignore next 4 -- minValue/maxValue delimitam a navegação e são
     repassados ao CalendarRoot; aqui só apertariam a lista de anos. Nenhuma
     story os passa, e nenhum conteúdo compartilhado os documenta. */
  // Simétrico, e não o que a lib oferece por padrão (cem anos para trás, dez
  // para frente): a lista precisa correr para os dois lados, e não é para uma
  // data no ano que vem ficar fora do alcance.
  return props.yearRange ?? createYearRange({
    start: props?.minValue ?? ancora.cycle('year', -EACH_SIDE_YEARS),
    end: props?.maxValue ?? ancora.cycle('year', EACH_SIDE_YEARS),
  })
})

/**
 * O resto do teclado da grade.
 *
 * A lib trata seta, Enter e Espaço; `Home`, `End`, `PageUp` e `PageDown` não
 * chegavam a lugar nenhum — o conteúdo compartilhado promete as quatro desde
 * sempre, e aqui elas simplesmente não faziam nada (medido: o foco ficava
 * parado no mesmo dia nas quatro teclas).
 *
 * A data de partida vem do elemento em FOCO, e não do `placeholder`: a
 * navegação por setas da lib move o foco sem mexer na visão, então o
 * placeholder está atrasado em relação ao que a pessoa vê em foco.
 *
 * O foco é devolvido depois do `nextTick` porque mudar o mês recria a grade: o
 * botão de destino ainda não existe no instante da tecla.
 */
function onGridKeyDown(evento: KeyboardEvent) {
  const raiz = evento.currentTarget as HTMLElement | null
  const destination = teclaTarget(isoDoElemento(evento.target as Element | null), evento)
  if (!destination || !raiz) return
  evento.preventDefault()
  placeholder.value = parseDate(destination)
  void nextTick(() => gridDay(raiz, destination)?.focus())
}

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
      :aria-label="rotulos.selecionarMes"
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
        <!-- Mês por EXTENSO, como no Vanilla, que é a referência: a forma curta
             em pt-BR sai com ponto ("jan."), e o ponto numa opção de uma palavra
             só é ruído — o mesmo motivo pelo qual ele já era removido do
             cabeçalho da semana. -->
        {{ formatter.custom(toDate(month), { month: 'long' }) }}
      </option>
    </select>
  </DefineMonthTemplate>

  <DefineYearTemplate v-slot="{ date }">
    <select
      :aria-label="rotulos.selecionarAno"
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
    @keydown="onGridKeyDown"
  >
    <!-- Mesma árvore do Vanilla, que é a referência de markup: a faixa de
         navegação é IRMÃ dos meses e fica por cima deles, e CADA mês traz a
         própria legenda no meio.
         Antes o cabeçalho era único e ficava fora do laço: com dois meses lado a
         lado apareciam duas grades e UMA legenda só, então a segunda tabela não
         dizia de que mês era. E o bloco `.nds-calendar-month`, que as outras
         quatro stacks têm, não existia aqui. -->
    <div class="nds-calendar-months">
      <!-- div (não <nav>): paginação de mês não é landmark de navegação — o
           <nav> sem rótulo repetia um landmark por calendário (landmark-unique);
           a referência cross-stack (vanilla) também usa div. -->
      <div class="nds-calendar-nav-overlay">
        <CalendarPrevButton :aria-label="rotulos.mesAnterior">
          <slot name="calendar-prev-icon" />
        </CalendarPrevButton>
        <CalendarNextButton :aria-label="rotulos.proximoMes">
          <slot name="calendar-next-icon" />
        </CalendarNextButton>
      </div>

      <div
        v-for="month in grid"
        :key="month.value.toString()"
        class="nds-calendar-month"
      >
        <CalendarHeader>
          <slot
            name="calendar-heading"
            :date="month.value"
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
              <!-- Mês e ano formatados SEPARADAMENTE e juntados por espaço, e não
                   num formato só: em pt-BR e es o Intl com month+year devolve
                   "abril de 2026", enquanto as outras stacks compõem "abril
                   2026". A legenda é texto visível, e divergir nela é divergir na
                   tela. -->
              <CalendarHeading>
                {{ formatter.custom(toDate(month.value), { month: 'long' }) }}
                {{ formatter.custom(toDate(month.value), { year: 'numeric' }) }}
              </CalendarHeading>
            </template>
          </slot>
        </CalendarHeader>

        <!-- A tabela se nomeia: sem `aria-label` o grid é anunciado como "tabela"
             e nada mais, e com dois meses na tela as duas soam iguais. -->
        <CalendarGrid
          :aria-label="`${formatter.custom(toDate(month.value), { month: 'long' })} ${formatter.custom(toDate(month.value), { year: 'numeric' })}`"
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
                  :bloqueado="props.isDateDisabled?.(weekDate) === true"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    </div>
  </CalendarRoot>
</template>
