<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import ComboboxIcon from './ComboboxIcon.vue'

const props = defineProps<ComboboxTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)

/*
 * Fora da ordem de tabulação — a lib já escreve `tabindex="-1"`. Quem tem foco
 * é o campo de texto, e o Tab tem de sair do campo, não parar num segundo alvo
 * que faz o que a seta já faz.
 *
 * A lib também escreve um `aria-label` fixo em inglês. Um `aria-label` vindo de
 * quem consome atravessa como atributo de sobra e vence esse padrão, que é como
 * o nome acessível chega traduzido.
 */
</script>

<template>
  <ComboboxTrigger
    data-slot="combobox-trigger"
    v-bind="forwardedProps"
    :class="cn('nds-combobox-trigger', props.class)"
  >
    <slot>
      <ComboboxIcon />
    </slot>
  </ComboboxTrigger>
</template>
