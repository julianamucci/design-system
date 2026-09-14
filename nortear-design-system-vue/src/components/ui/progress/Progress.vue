<script setup lang="ts">
/**
 * Progress — barra passiva com `role="progressbar"` sobre o `ProgressRoot` da reka-ui.
 *
 * A regra do valor é a compartilhada (`@shared/primitives/progress-value`), a
 * mesma nas cinco stacks:
 *
 *  - **Omitir o valor é indeterminado.** Ausente, `null` e não finito (`NaN`)
 *    dão o modo sem estimativa, igual ao `<progress>` nativo. Até 2026-09-14 o
 *    padrão aqui era ZERO: uma barra vazia e parada que parecia travada, onde
 *    duas outras stacks mostravam o traço correndo.
 *  - **`min` é respeitado** no limite, no percentual (`--value`) e em
 *    `aria-valuemin`. Máximo menor ou igual ao mínimo vira mínimo + 100.
 *  - **`aria-valuetext` sempre**: o percentual arredondado ("42%"), ou
 *    "Em andamento" sem valor. Quem passa `getValueText` vence o padrão, com a
 *    assinatura da lib — `(value, max)`, o valor já limitado à faixa.
 *
 * ─── O que a lib não sabe fazer, e como se contorna ─────────────────────────
 *
 * A reka-ui crava `aria-valuemin="0"`, e troca por `null` (com `console.error`)
 * qualquer valor abaixo de zero ou acima do máximo. Por isso a lib recebe a
 * faixa DESLOCADA — `valor − min` sobre `max − min`, que é sempre válida — e os
 * atributos que ela escreve com esses números (`aria-valuemin/now/max`,
 * `data-value`, `data-max`, na raiz e no indicador) são reescritos aqui com os
 * valores reais. O
 * `data-state` sai certo sem ajuste: `valor − min === max − min` só quando o
 * valor é o máximo. Atributo passado ao `ProgressRoot` que não é prop dele cai
 * por cima do que ele renderiza (fallthrough), e é isso que faz a troca valer.
 *
 * `getValueLabel` fica fixo em `undefined`. O padrão da lib escrevia o
 * percentual em `aria-label` — um NOME fabricado ("42%") que escondia do axe a
 * barra sem nome de verdade (D9). O nome é de quem compõe, por `aria-label`.
 */
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import {
  ProgressIndicator,
  ProgressRoot,
} from 'reka-ui'
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<Omit<ProgressRootProps, 'getValueLabel'> & {
    /** Valor mínimo da escala. Padrão 0. */
    min?: number
    class?: HTMLAttributes['class']
  }>(),
  {
    modelValue: null,
    min: 0,
    max: 100,
    getValueText: undefined,
  },
)

/** Faixa usável — máximo ≤ mínimo é corrigido pela regra compartilhada. */
const range = computed(() => resolveProgressRange(props.min, props.max))

/** Valor limitado à faixa, ou `null` no indeterminado. */
const value = computed(() => resolveProgressValue(props.modelValue, range.value))

// A lib trabalha na faixa deslocada para zero — ver o docblock.
const libValue = computed(() => (value.value === null ? null : value.value - range.value.min))
const libMax = computed(() => range.value.max - range.value.min)

/** Nenhum nome fabricado a partir do valor (D9). */
const noValueLabel = () => undefined

const valueText = computed(() => {
  if (props.getValueText) return props.getValueText(value.value, range.value.max)
  return progressValueText(value.value, range.value)
})

// A lib publica `data-state="indeterminate"`; o CSS compartilhado lê
// `data-indeterminate`, que é o vocabulário que a auditoria cross-stack
// compara. `undefined` remove o atributo — `data-indeterminate="false"`
// casaria `[data-indeterminate]` do mesmo jeito.
const indeterminate = computed(() => (value.value === null ? '' : undefined))

// O desenho sai da custom property, nunca de `transform` inline: estilo inline
// vence a folha e levaria embora a transição que ela declara. `--value` é o
// PERCENTUAL (0–100), nunca o número cru. String, porque o valor de uma custom
// property é texto.
const indicatorStyle = computed(() => {
  const percent = progressPercent(value.value, range.value)
  return percent === null ? undefined : { '--value': String(percent) }
})
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    :model-value="libValue"
    :max="libMax"
    :get-value-label="noValueLabel"
    :as="props.as"
    :as-child="props.asChild"
    :aria-valuemin="range.min"
    :aria-valuemax="range.max"
    :aria-valuenow="value ?? undefined"
    :aria-valuetext="valueText"
    :data-value="value ?? undefined"
    :data-max="range.max"
    :data-indeterminate="indeterminate"
    :class="cn('nds-progress', props.class)"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="nds-progress-indicator"
      :data-value="value ?? undefined"
      :data-max="range.max"
      :style="indicatorStyle"
    />
  </ProgressRoot>
</template>
