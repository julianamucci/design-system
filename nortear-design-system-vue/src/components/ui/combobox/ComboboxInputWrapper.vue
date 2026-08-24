<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { injectComboboxRootContext, injectListboxRootContext } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useComboboxContext } from './index'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const rootContext = injectComboboxRootContext()
const listboxContext = injectListboxRootContext()
const { announcement, chipsLayout } = useComboboxContext()

/*
 * `data-chips` é o que a folha lê para escolher entre acumular linhas e rolar
 * na horizontal, e ele mora AQUI porque este é o elemento que a folha consulta
 * (`[data-chips="single-line"] .nds-combobox-chips`). A escolha em si vem da
 * raiz, pelo contexto — ver a nota da prop em `Combobox.vue`.
 *
 * Escrito no template, e não por `v-bind` de fallthrough: um `data-chips`
 * posto à mão em `<ComboboxInputWrapper data-chips="...">` ainda vence, porque
 * o atributo herdado é aplicado depois do declarado. É a saída para o caso em
 * que a raiz não é de quem monta o campo.
 */

/*
 * A lista da lib PARA na ponta: `onKeydownNavigation` corta a coleção a partir
 * da opção ativa e, quando o corte fica vazio, não muda nada. O contrato de
 * teclado deste componente é circular — "da última volta à primeira" —, então
 * a volta é escrita aqui.
 *
 * Em CAPTURA, e no wrapper e não no próprio campo de texto: um ouvinte
 * registrado no mesmo elemento dispara na ordem de registro, e o da lib é
 * sempre o primeiro. Capturar um nível acima é o único ponto em que dá para
 * decidir ANTES dela — e, decidindo antes, `stopPropagation` impede que os dois
 * mexam na mesma tecla.
 */
function options(): HTMLElement[] {
  const root = rootContext.parentElement.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>('[data-slot="combobox-item"]:not([data-disabled])'),
  )
}

function onKeydownCapture(event: KeyboardEvent): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  if (!rootContext.open.value) return

  const target = event.target as HTMLElement | null
  if (target?.dataset.slot !== 'combobox-input') return

  const current = listboxContext.highlightedElement.value
  if (!current) return

  const list = options()
  if (list.length < 2) return

  const first = list[0]
  const last = list[list.length - 1]

  if (event.key === 'ArrowDown' && current === last) {
    event.preventDefault()
    event.stopPropagation()
    listboxContext.changeHighlight(first)
    return
  }

  if (event.key === 'ArrowUp' && current === first) {
    event.preventDefault()
    event.stopPropagation()
    listboxContext.changeHighlight(last)
  }
}
</script>

<template>
  <div
    data-slot="combobox-input-wrapper"
    :data-chips="chipsLayout"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :class="cn('nds-combobox-input-wrapper', props.class)"
    @keydown.capture="onKeydownCapture"
  >
    <slot />
    <span
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="nds-sr-only"
    >{{ announcement }}</span>
  </div>
</template>
