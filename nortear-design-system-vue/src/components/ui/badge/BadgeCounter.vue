<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Contador da etiqueta — o número que fica à DIREITA do texto, dentro do
 * próprio Badge.
 *
 * **Subcomponente, e não slot nomeado no Badge.** As duas formas renderizariam
 * o mesmo markup, mas o slot nomeado obrigaria o Badge a decidir a ordem, e o
 * contador é só mais um filho depois do texto — quem compõe já controla isso
 * pelo slot padrão. É também a forma que a stack usa em toda subparte
 * (`AlertTitle`, `AlertDescription`, `AlertAction`), então quem já conhece um
 * componente daqui não precisa aprender uma segunda convenção.
 *
 * **Não é variante.** Qualquer variante do Badge aceita o contador; fosse
 * variante, o número de combinações dobraria para dizer a mesma coisa.
 *
 * A cor é NEUTRA de propósito, e isso está medido no `nds/badge.css`: pintar o
 * número com a cor da variante o derruba abaixo de 4.5:1 em parte dos temas. A
 * cor da variante continua visível — quem a carrega é a borda ao redor.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    data-slot="badge-counter"
    :class="cn('nds-badge-counter', props.class)"
  >
    <slot />
  </span>
</template>
