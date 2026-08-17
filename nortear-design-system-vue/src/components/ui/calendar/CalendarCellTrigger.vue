<script lang="ts" setup>
import type { CalendarCellTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarCellTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<
    CalendarCellTriggerProps & {
      class?: HTMLAttributes['class']
      /** O dia está bloqueado pela regra de datas de quem monta o calendário. */
      bloqueado?: boolean
    }
  >(),
  { as: 'button', bloqueado: false },
)

const delegatedProps = reactiveOmit(props, 'class', 'bloqueado')

const forwardedProps = useForwardProps(delegatedProps)

// Sem compor `.nds-button .nds-button-ghost` por fora: `.nds-calendar-day-btn`
// é auto-suficiente por contrato (ver o comentário da classe em calendar.css), e
// a composição custava caro. A lib marca o dia escolhido com `aria-pressed`, e a
// folha do botão tem `.dark .nds-button-ghost[aria-pressed="true"]` — três
// classes, que vencem a regra do calendário. Resultado medido: no tema ESCURO o
// dia escolhido perdia o fundo `--primary` e ficava com texto `--primary-fg`
// sobre `--accent`, 1.18:1. Invisível, e só no escuro, que o axe não vê.

// A lib dá tabindex 0 ao dia corrente e -1 aos demais do mês, mas deixa os dias
// de fora do mês SEM atributo — e um <button> sem tabindex é tabulável. O grid
// é UMA parada de tabulação: quem completa a primeira e a última semana não é
// destino.
//
// A correção anterior escrevia `:tabindex="foraDoMes ? -1 : undefined"`, e o
// `undefined` não era neutro: atributo vindo do consumidor vence a ligação
// interna do componente, então TODO dia do mês perdia o -1 da lib e virava
// parada de tabulação. Medido, o grid tinha 30 paradas em vez de 1 — o oposto
// do que a correção queria. Por isso a ligação agora só EXISTE quando há algo a
// forçar; no resto, a lib manda.
//
// O dia BLOQUEADO cai no mesmo `undefined` da lib, então entra na tabulação
// junto. Nas outras quatro stacks ele fica fora — num mês com quinze datas
// bloqueadas isso são quinze paradas para chegar ao primeiro dia escolhível.
const foraDoMes = computed(() => props.day.month !== props.month.month)
const tabulacao = computed(() =>
  foraDoMes.value || props.bloqueado ? { tabindex: -1 } : {},
)
</script>

<template>
  <CalendarCellTrigger
    data-slot="calendar-cell-trigger"
    :class="cn('nds-calendar-day-btn', props.class)"
    v-bind="{ ...forwardedProps, ...tabulacao }"
  >
    <slot />
  </CalendarCellTrigger>
</template>
