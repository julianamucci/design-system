<script setup lang="ts">
import type { ListboxContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, unrefElement } from '@vueuse/core'
import { ListboxContent, injectListboxRootContext, useForwardProps } from 'reka-ui'
import { nextTick, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand } from './index'

const props = defineProps<ListboxContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)

// O id vem da raiz porque é o alvo do `aria-controls` do campo de busca, que é
// irmão desta lista. Sem ele o `role="combobox"` aponta para um id órfão.
// O nome também vem de lá: é o placeholder do campo, como no Vanilla — a lista
// se chama pelo que se está buscando, e não por um "Resultados" genérico.
const { listId, searchLabel, filterState } = useCommand()

/*
 * D11 (PRD): ao montar e a cada busca, o primeiro comando HABILITADO fica em
 * destaque — digitar e apertar Enter executa, sem seta no meio.
 *
 * A lib só fazia a metade da busca: o `ListboxFilter` chama `highlightFirstItem`
 * a cada `input`, e nada ao montar — a paleta abria sem destaque, e Enter antes
 * da primeira tecla não fazia nada. Nem a busca escrita por quem consome (a que
 * semeia `model-value`) nem a que volta ao zero depois de uma escolha passam
 * por `input`, então a busca também é vigiada aqui.
 *
 * Por que `changeHighlight(el, false, false)` e não o `highlightFirstItem` do
 * contexto: o dele chama `scrollIntoView`, que ao montar rolaria a PÁGINA até
 * cada paleta — na docs page, até o cartão de Variantes lá embaixo. Aqui a
 * lista volta ao topo e o destaque fica à vista sem mexer em mais nada; e sem
 * foco (o terceiro argumento), porque o campo inline não rouba o foco (C12).
 *
 * Sem comando habilitado na tela, o destaque é LIMPO: a lib guardaria o último
 * elemento, já fora do DOM, e o `aria-activedescendant` apontaria para ele.
 */
const listboxContext = injectListboxRootContext()
const listRef = ref<InstanceType<typeof ListboxContent>>()

function highlightFirstEnabled() {
  const list = unrefElement(listRef)
  if (!(list instanceof HTMLElement)) return
  list.scrollTop = 0
  const first = list.querySelector<HTMLElement>('[data-slot="command-item"]:not([data-disabled])')
  if (first) listboxContext.changeHighlight(first, false, false)
  else listboxContext.highlightedElement.value = null
}

onMounted(async () => {
  // Espera o tique em que os comandos se registram na coleção da lib.
  await nextTick()
  // Destaque que já está de pé é respeitado: é o do item escolhido por
  // `v-model`, que a lib acende ao montar.
  const current = listboxContext.highlightedElement.value
  if (current?.isConnected && !current.hasAttribute('data-disabled')) return
  highlightFirstEnabled()
})

watch(
  () => filterState.search,
  async () => {
    // Depois do tique, o filtro já desmontou o que não casa.
    await nextTick()
    highlightFirstEnabled()
  },
)
</script>

<!--
  O `mousedown` na lista é cancelado para o ponteiro não tirar o foco do campo
  (PRD, D1: o item nunca recebe foco do DOM). Com o campo montado, a lib dá
  `tabindex="-1"` à lista e a cada comando — o que os tira da ordem de Tab, mas
  NÃO do clique: o `mousedown` levava o foco para o comando clicado, e a pessoa
  tinha de voltar ao campo para continuar digitando. O `click`, que é o que
  seleciona, não depende do `mousedown` e segue valendo. Mesmo tratamento do
  Vanilla.
-->
<template>
  <ListboxContent
    :id="listId"
    ref="listRef"
    data-slot="command-list"
    v-bind="forwarded"
    :aria-label="($attrs['aria-label'] as string) || searchLabel || 'Resultados'"
    :class="cn('nds-command-list', props.class)"
    @mousedown.prevent
  >
    <slot />
  </ListboxContent>
</template>
