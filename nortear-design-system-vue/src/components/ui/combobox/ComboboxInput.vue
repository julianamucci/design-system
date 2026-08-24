<script setup lang="ts">
import type { ComboboxInputProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxInput, injectComboboxRootContext } from 'reka-ui'
import { watch } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxContext } from './index'

const props = defineProps<ComboboxInputProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class', 'displayValue', 'modelValue')

const rootContext = injectComboboxRootContext()
const { inputId, listId, labels, search, announce } = useComboboxContext()

/*
 * O `aria-controls` do campo é escrito pela lib a partir de `contentId`, e esse
 * id só nasce quando a LISTA monta — ou seja, nunca antes da primeira abertura.
 * Até lá o atributo saía vazio, apontando para lugar nenhum. Semear o id aqui,
 * do lado do campo, resolve pela ordem: este `setup` roda antes de qualquer
 * abertura, o `||=` da lib encontra o valor já posto e o respeita, e a lista
 * nasce com o mesmo id para o qual o campo já apontava.
 */
rootContext.contentId ||= listId

/*
 * No modo simples o campo de texto mostra o RÓTULO do escolhido, não o valor.
 * A lib guarda só o valor, então o rótulo vem do mapa que cada opção alimenta
 * ao montar. Quem tiver rótulo fora da lista passa `display-value` e vence este
 * padrão.
 */
function displayValue(value: unknown): string {
  if (props.displayValue) return props.displayValue(value)
  if (value === null || value === undefined || Array.isArray(value)) return ''
  const key = String(value)
  return labels.value.get(key) ?? key
}

/*
 * No modo múltiplo, escolher significa "já registrei, pode digitar o próximo":
 * o texto sai do caminho para a lista voltar inteira. A lib só zera o texto
 * quando a lista está FECHADA, e no múltiplo ela continua aberta — o filtro
 * ficaria de pé escondendo tudo o que sobrou.
 */
watch(
  () => rootContext.modelValue.value,
  () => {
    if (!rootContext.multiple.value) return
    search.value = ''
    rootContext.filterSearch.value = ''
  },
  { deep: true },
)

/*
 * O nome acessível do botão de remover daquele chip é a frase que a região viva
 * anuncia. Assim a remoção pelo teclado diz exatamente o que o botão diria, sem
 * que o primitivo precise carregar texto traduzido próprio.
 */
function removalMessage(value: string): string {
  const root = rootContext.parentElement.value
  if (!root) return ''
  const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'))
  const chip = chips.find(node => node.dataset.value === value)
  return chip
    ?.querySelector('[data-slot="combobox-chip-remove"]')
    ?.getAttribute('aria-label') ?? ''
}

/* O gesto que define o chip: sem ele, desfazer uma escolha obriga o mouse. */
function removeLast(event: KeyboardEvent): void {
  if (!rootContext.multiple.value) return
  if (search.value !== '') return

  const current = rootContext.modelValue.value
  if (!Array.isArray(current) || current.length === 0) return

  event.preventDefault()
  const last = String(current[current.length - 1])
  const message = removalMessage(last)
  rootContext.modelValue.value = current.slice(0, -1)
  if (message) announce(message)
}

/*
 * Duas funções na mesma tecla, e a ordem importa. Com a lista aberta quem fecha
 * é a camada de dispensa da lib; só quando já não há o que fechar é que Escape
 * passa a limpar o texto digitado.
 */
function clearWhenClosed(event: KeyboardEvent): void {
  if (rootContext.open.value) return
  if (search.value === '') return
  event.preventDefault()
  search.value = ''
  rootContext.filterSearch.value = ''
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Backspace') {
    removeLast(event)
    return
  }
  if (event.key === 'Escape') clearWhenClosed(event)
}
</script>

<template>
  <ComboboxInput
    :id="inputId"
    v-bind="delegatedProps"
    v-model="search"
    data-slot="combobox-input"
    :display-value="displayValue"
    :class="cn('nds-combobox-input', props.class)"
    @keydown="onKeydown"
  >
    <slot />
  </ComboboxInput>
</template>
