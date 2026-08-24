<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useCurrentElement } from '@vueuse/core'
import { ComboboxItem, useForwardPropsEmits } from 'reka-ui'
import { onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxContext } from './index'

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ComboboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const { labels } = useComboboxContext()

const itemRef = ref()
const currentElement = useCurrentElement(itemRef)

/*
 * Cada opção publica o próprio rótulo no mapa da raiz, e é dele que o campo de
 * texto tira o que mostrar no modo simples — a lib guarda só o valor.
 *
 * O mapa NÃO apaga no desmonte, de propósito: a lista some ao fechar, e um
 * valor escolhido antes disso ficaria sem rótulo justamente no instante em que
 * o campo precisa dele.
 */
onMounted(() => {
  const element = currentElement.value
  if (!(element instanceof HTMLElement)) return
  const label = props.textValue ?? element.textContent?.trim() ?? ''
  if (label) labels.value.set(String(props.value), label)
})
</script>

<template>
  <ComboboxItem
    ref="itemRef"
    v-bind="forwarded"
    data-slot="combobox-item"
    :data-value="String(props.value)"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :class="cn('nds-combobox-item', props.class)"
  >
    <slot />
  </ComboboxItem>
</template>
