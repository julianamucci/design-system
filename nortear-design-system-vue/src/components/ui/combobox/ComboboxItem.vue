<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useCurrentElement } from '@vueuse/core'
import { ComboboxItem, injectComboboxRootContext, useForwardPropsEmits } from 'reka-ui'
import { computed, onUnmounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxContext, useComboboxGroupContext } from './index'

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ComboboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const rootContext = injectComboboxRootContext()
const { labels, filter } = useComboboxContext()
/* Uma opção também vive solta, fora de grupo — daí o `null` de reserva. */
const groupContext = useComboboxGroupContext(null)

const itemRef = ref()
const currentElement = useCurrentElement(itemRef)

const itemValue = computed(() => String(props.value))

/*
 * O rótulo que o filtro compara. Enquanto a opção não montou não há texto para
 * ler, e o valor entra no lugar: é o que a lib também mostraria.
 */
const itemLabel = computed(() => props.textValue ?? labels.value.get(itemValue.value) ?? itemValue.value)

/*
 * Com filtro do consumidor, a lib está desligada (`ignoreFilter`) e quem
 * decide é esta linha. O `v-if` é o MESMO recurso que a lib usa quando filtra
 * por conta própria: opção fora do filtro sai do DOM, e não fica escondida por
 * folha de estilo. Isso é o que mantém a navegação por setas, a mensagem de
 * lista vazia e o `hide-when-empty` medindo o que está de fato na tela.
 *
 * A busca vem de `filterSearch`, e não do texto do campo: é o texto pelo qual a
 * lista filtra. Ao abrir, a lib zera essa busca de propósito, para que a lista
 * inteira reapareça mesmo com o rótulo do escolhido escrito no campo.
 */
const isVisible = computed(() => {
  const predicate = filter.value
  if (!predicate) return true
  const query = rootContext.filterSearch.value
  if (!query) return true
  return predicate(
    { value: itemValue.value, label: itemLabel.value, disabled: props.disabled },
    query,
  )
})

/*
 * Cada opção publica o próprio rótulo no mapa da raiz, e é dele que o campo de
 * texto tira o que mostrar no modo simples — a lib guarda só o valor.
 *
 * A publicação segue o ELEMENTO, e não o montar do componente: com filtro do
 * consumidor a opção entra e sai do DOM, e o que existia ao montar podia não
 * ser o que está lá agora.
 *
 * O mapa NÃO apaga na saída, de propósito: a lista some ao fechar, e um valor
 * escolhido antes disso ficaria sem rótulo justamente no instante em que o
 * campo precisa dele.
 */
watch(currentElement, (element) => {
  if (!(element instanceof HTMLElement)) return
  const label = props.textValue ?? element.textContent?.trim() ?? ''
  if (label) labels.value.set(itemValue.value, label)
}, { immediate: true, flush: 'post' })

/*
 * O grupo precisa saber quantas opções lhe sobraram para decidir se o próprio
 * cabeçalho ainda tem sobre o que falar.
 */
watch(isVisible, (visible) => {
  if (!groupContext) return
  if (visible) groupContext.visibleValues.value.add(itemValue.value)
  else groupContext.visibleValues.value.delete(itemValue.value)
}, { immediate: true })

onUnmounted(() => {
  groupContext?.visibleValues.value.delete(itemValue.value)
})
</script>

<template>
  <ComboboxItem
    v-if="isVisible"
    ref="itemRef"
    v-bind="forwarded"
    data-slot="combobox-item"
    :data-value="itemValue"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :class="cn('nds-combobox-item', props.class)"
  >
    <slot />
  </ComboboxItem>
</template>
