<script setup lang="ts">
import type { ListboxItemEmits, ListboxItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useCurrentElement } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'
import { ListboxItem, injectListboxRootContext, useForwardProps, useId } from 'reka-ui'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand, useCommandGroup } from './index'

const props = defineProps<ListboxItemProps & {
  class?: HTMLAttributes['class']
  /**
   * Estado de marcação. `undefined` = o item não é marcável e não ganha marca;
   * definido, vira `data-checked` e a folha compartilhada acende (ou apaga) o
   * ícone por opacidade — sem mexer no DOM, para a largura do item não pular a
   * cada troca.
   */
  checked?: boolean
}>()
const emits = defineEmits<ListboxItemEmits>()

type CommandSelectEvent = ListboxItemEmits['select'][0]

// `checked` sai do repasse: é prop desta camada, não do primitivo, e como
// atributo solto viraria `checked="true"` num `<div>`.
const delegatedProps = reactiveOmit(props, 'class', 'checked')

// Só as PROPS são repassadas. O `select` do primitivo é interceptado abaixo
// porque ele é emitido ANTES da checagem de `disabled` (conferido em
// node_modules): repassá-lo direto faria um comando desabilitado executar.
const forwarded = useForwardProps(delegatedProps)

const id = useId()
const { filterState, allItems, allGroups } = useCommand()
const groupContext = useCommandGroup()
const listboxContext = injectListboxRootContext()

const isRender = computed(() => {
  if (!filterState.search) {
    return true
  }
  else {
    const filteredCurrentItem = filterState.filtered.items.get(id)
    // If the filtered items is undefined means not in the all times map yet
    // Do the first render to add into the map
    if (filteredCurrentItem === undefined) {
      return true
    }

    // Check with filter
    return filteredCurrentItem > 0
  }
})

const itemRef = ref()
const currentElement = useCurrentElement(itemRef)

/*
 * O primitivo escreve `aria-selected` a partir do MODELO (o item escolhido) e
 * marca o destaque só com `data-highlighted`. Nesta paleta os dois papéis não
 * coincidem: o destaque é o que as setas movem, é o que o
 * `aria-activedescendant` aponta, e é o que a folha compartilhada pinta
 * (`.nds-command-item[aria-selected="true"]`). Com o padrão do primitivo a
 * navegação por teclado não acendia nada, e o último comando escolhido ficava
 * aceso para sempre.
 *
 * Por que um efeito no elemento e não uma prop: o primitivo compõe
 * `mergeProps(attrs, propsDoFilho)` — o filho VENCE, então um `aria-selected`
 * passado daqui é aceito e descartado em silêncio. O efeito roda em
 * `flush: 'post'`, depois do patch, e lê `modelValue` de propósito: é a única
 * outra coisa que faz o primitivo reescrever o atributo.
 */
const isHighlighted = computed(
  () => !!currentElement.value && listboxContext.highlightedElement.value === currentElement.value,
)

watchEffect(() => {
  const el = currentElement.value
  if (!(el instanceof HTMLElement)) return
  void listboxContext.modelValue.value
  el.setAttribute('aria-selected', isHighlighted.value ? 'true' : 'false')
}, { flush: 'post' })

const isCheckable = computed(() => props.checked !== undefined)
const checkedAttr = computed(() => (props.checked === undefined ? undefined : String(props.checked)))
const valueAttr = computed(() => (props.value === undefined || props.value === null ? undefined : String(props.value)))

function onSelect(event: CommandSelectEvent) {
  // O primitivo emite `select` ANTES de conferir `disabled`, então sem esta
  // guarda um comando desabilitado executaria a ação de quem consome.
  if (props.disabled) {
    event.preventDefault()
    return
  }
  // A busca volta ao zero para o próximo comando — o campo não pode virar o
  // nome do que acabou de rodar.
  filterState.search = ''
  emits('select', event)
}

onMounted(() => {
  if (!(currentElement.value instanceof HTMLElement))
    return

  // textValue to perform filter
  allItems.value.set(id, currentElement.value.textContent ?? (props.value?.toString() ?? ''))

  const groupId = groupContext?.id
  if (groupId) {
    if (!allGroups.value.has(groupId)) {
      allGroups.value.set(groupId, new Set([id]))
    }
    else {
      allGroups.value.get(groupId)?.add(id)
    }
  }
})
onUnmounted(() => {
  allItems.value.delete(id)
})
</script>

<template>
  <ListboxItem
    v-if="isRender"
    v-bind="forwarded"
    :id="id"
    ref="itemRef"
    :aria-disabled="props.disabled ? 'true' : undefined"
    data-slot="command-item"
    :data-value="valueAttr"
    :data-checked="checkedAttr"
    :class="cn('nds-command-item', props.class)"
    @select="onSelect"
  >
    <slot />
    <!--
      A marca só existe quando o item é marcável. Antes ela vinha em TODOS os
      itens com `opacity: 0`, e um ícone invisível de 16px continua ocupando a
      borda direita de cada linha — espaço reservado para um estado que aquele
      item nunca assume. Decorativa: quem anuncia o estado é o `data-checked`.
    -->
    <CheckIcon
      v-if="isCheckable"
      class="nds-command-item-check"
      aria-hidden="true"
    />
  </ListboxItem>
</template>
