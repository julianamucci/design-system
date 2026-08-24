<script setup lang="ts">
import type { ComboboxCancelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { XIcon } from 'lucide-vue-next'
import { ComboboxCancel, injectComboboxRootContext } from 'reka-ui'
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxContext } from './index'

const props = defineProps<ComboboxCancelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const rootContext = injectComboboxRootContext()
const { search, announce } = useComboboxContext()
const attrs = useAttrs()

const disabled = computed(() => rootContext.disabled.value)

/*
 * A lib zera o filtro, a escolha e o valor do elemento; o TEXTO que esta camada
 * controla continuaria e voltaria à tela na renderização seguinte. Os dois
 * manipuladores convivem — o da lib entra primeiro, este depois —, então aqui
 * só está o que falta.
 *
 * `tabindex="0"` desfaz o `-1` que a lib escreve. Na referência Vanilla só o
 * gatilho sai do percurso do Tab; o botão de limpar é a única forma de zerar a
 * escolha inteira sem o mouse, e um controle sem foco não tem forma nenhuma.
 */
function clear(): void {
  const message = attrs['aria-label']
  search.value = ''
  if (typeof message === 'string' && message) announce(message)
}
</script>

<template>
  <ComboboxCancel
    data-slot="combobox-clear"
    v-bind="delegatedProps"
    tabindex="0"
    :disabled="disabled"
    :class="cn('nds-combobox-clear', props.class)"
    @click="clear"
  >
    <slot>
      <XIcon aria-hidden="true" />
    </slot>
  </ComboboxCancel>
</template>
