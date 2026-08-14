<script setup lang="ts">
import type { ListboxFilterProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SearchIcon } from 'lucide-vue-next'
import { ListboxFilter, useForwardProps } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand } from './index'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ListboxFilterProps & {
  class?: HTMLAttributes['class']
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const { filterState, listId } = useCommand()

// A busca mora no estado do `Command` (é ele que filtra), e o `v-model` interno
// abaixo vencia o `model-value` escrito por quem consome — a prop era aceita e
// ignorada em silêncio, e um exemplo que abre já filtrado nascia sem filtro
// nenhum. Aqui ela SEMEIA o estado da raiz, que é onde ela faz efeito.
watch(
  () => props.modelValue,
  async (valor) => {
    if (valor === undefined || valor === filterState.search) return
    // Espera os comandos se registrarem: o filtro roda sobre o texto que cada
    // um publica ao montar, e semear antes disso filtraria uma lista vazia.
    await nextTick()
    filterState.search = valor
  },
  { immediate: true },
)

/**
 * Sem resultado, `aria-activedescendant` fica apontando para um item que já
 * saiu do DOM — a lib mantém o último id e não o limpa quando o filtro esvazia
 * a lista. Referência ARIA para um elemento inexistente é violação de verdade
 * (`aria-valid-attr-value`), e o leitor de tela tenta anunciar um nó removido.
 *
 * O axe pegou isso na story de estado vazio. O atributo é escrito pela lib
 * depois da nossa renderização, então não dá para vencê-lo por binding: a
 * limpeza é feita no elemento, no tique seguinte.
 */
const raiz = ref<HTMLElement | null>(null)
const semResultados = computed(
  () => !!filterState.search && filterState.filtered.count === 0,
)
watch(
  semResultados,
  async (vazio) => {
    if (!vazio) return
    await nextTick()
    raiz.value
      ?.querySelector('[data-slot="command-input"]')
      ?.removeAttribute('aria-activedescendant')
  },
  { immediate: true },
)
</script>

<!--
  O primitivo de filtro desta stack renderiza um `<input type="text">` puro: ele
  mantém `aria-activedescendant`, e mais nada. O papel de combobox, o
  `aria-autocomplete` e o `aria-controls` apontando para a lista são escritos
  aqui — é o que o Vanilla (referência de markup) já emite, e sem eles o leitor
  de tela anuncia um campo de texto comum, sem dizer que há uma lista do outro
  lado. `aria-expanded` é fixo em `true` porque a paleta não tem estado fechado:
  quem abre e fecha é o Popover ou o Dialog em volta.
-->
<template>
  <div
    ref="raiz"
    data-slot="command-input-wrapper"
    class="nds-command-input-wrapper"
  >
    <!-- Decorativa: quem nomeia o campo é o `aria-label`, e uma lupa anunciada
         só repetiria "buscar" para quem usa leitor de tela. -->
    <SearchIcon aria-hidden="true" />
    <ListboxFilter
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      data-slot="command-input"
      auto-focus
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      :aria-controls="listId"
      :aria-label="($attrs['aria-label'] as string) || ($attrs.placeholder as string) || 'Buscar'"
      :class="cn('nds-command-input', props.class)"
    />
  </div>
</template>
