<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'
import {
  ProgressIndicator,
  ProgressRoot,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(),
  {
    modelValue: 0,
  },
)

// `modelValue` sai da delegação porque o que chega à lib é o valor LIMITADO, e
// não o pedido: o `v-bind` repassaria o número cru e a raiz anunciaria um
// `aria-valuenow` que a barra não desenha.
const delegatedProps = reactiveOmit(props, 'class', 'modelValue')

/** A escala da barra — a lib assume 100 quando ninguém pede outra. */
const scale = computed(() => props.max ?? 100)

// Valor limitado à faixa [0, max] ANTES de desenhar e antes de anunciar.
//
// Sem o limite, valor acima do máximo e valor negativo davam a MESMA tela — uma
// barra vazia — com o número fora da faixa sendo anunciado ao leitor de tela, e
// nada ficava vermelho: o recorte da trilha escondia o resto.
//
// `null`/`undefined` continuam sendo o modo sem estimativa, que é outra coisa de
// zero: zero mentiria, diria "0%" quando a verdade é "não sei quanto falta".
// Número não finito cai no indeterminado pelo mesmo motivo — não há porcentagem
// que `NaN` possa anunciar.
const clampedValue = computed(() => {
  const requested = props.modelValue
  if (requested == null || !Number.isFinite(requested)) return null
  return Math.min(Math.max(requested, 0), scale.value)
})

// A lib publica o estado em `data-state="indeterminate"`; as outras stacks
// publicam `data-indeterminate`. O CSS compartilhado se apoia no segundo, que é
// o vocabulário de markup que a auditoria cross-stack compara — então a
// tradução acontece aqui, e não com um seletor extra na folha compartilhada.
// `undefined` remove o atributo: presença é o que o seletor testa, e
// `data-indeterminate="false"` casaria `[data-indeterminate]` do mesmo jeito.
const indeterminado = computed(() =>
  clampedValue.value == null ? '' : undefined,
)

// O desenho sai da custom property, nunca de `transform` inline: estilo inline
// vence qualquer especificidade, então escrever a posição aqui SOBRESCREVERIA a
// regra do design system em vez de alimentá-la — e com ela iria embora a
// transição de `transform` que a folha declara. Quem desenha é
// `translateX(calc((var(--value, 0) - 100) * 1%))` em `.nds-progress-indicator`;
// aqui só se calcula a PORCENTAGEM, que é onde `max` entra.
//
// `null` é o indeterminado, e aí NENHUMA property de valor é escrita: é o que
// devolve o `transform: none` da folha e deixa o traço correr.
const drawnPercent = computed(() => {
  if (clampedValue.value == null) return null
  return scale.value > 0 ? (clampedValue.value / scale.value) * 100 : 0
})

// String e não número, como no angular: o valor de uma custom property é texto,
// e passar número deixa a conversão na mão do runtime.
const indicatorStyle = computed(() =>
  drawnPercent.value == null ? undefined : { '--value': String(drawnPercent.value) },
)
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :model-value="clampedValue"
    :data-indeterminate="indeterminado"
    :class="cn( 'nds-progress', props.class, )"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="nds-progress-indicator"
      :style="indicatorStyle"
    />
  </ProgressRoot>
</template>
