<script setup lang="ts">
import type { ContextMenuContentEmits, ContextMenuContentProps, PointerDownOutsideEvent } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ContextMenuContent,
  ContextMenuPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { useTabCloses } from './context-menu.context'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ContextMenuContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Tab fecha e segue a página (C2): o ouvinte de captura e, no fechamento, o
// destino — `onCloseAutoFocus` pousa o foco no próximo ponto de tabulação
// depois da área, e não de volta nela. Sem destino (a área é o último ponto da
// página), a lib segue o caminho de sempre e devolve o foco à área.
// PATCH: a11y — a reka prende o Tab no modo modal; aqui ele fecha e segue a página (ver PATCHES.md#vue-context-menu-tab-closes)
const { root, channel, onKeydownCapture, onCloseAutoFocus } = useTabCloses()

/**
 * O clique direito NA PRÓPRIA ÁREA, com o menu aberto, não fecha: a lib o barra
 * (`ContextMenuContent` da reka) e reabre o painel no novo ponto. Anotar
 * `overlay` ali deixaria a anotação pendurada até o próximo fechamento, que
 * sairia com o motivo errado.
 */
function onPointerDownOutside(event: PointerDownOutsideEvent) {
  const original = event.detail.originalEvent
  const area = root?.triggerElement.value
  if (original.button === 2 && area && event.target instanceof Node && area.contains(event.target)) return
  channel.note('overlay')
}

/**
 * Só o foco que sai SEM ser barrado fecha. No modo modal a lib barra sempre (o
 * foco é devolvido ao painel), e anotar ali seria o mesmo vazamento de cima.
 */
function onFocusOutside(event: Event) {
  if (!event.defaultPrevented) channel.note('overlay')
}
</script>

<template>
  <ContextMenuPortal>
    <ContextMenuContent
      data-slot="context-menu-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
      @pointer-down-outside="onPointerDownOutside"
      @focus-outside="onFocusOutside"
      @close-auto-focus="onCloseAutoFocus"
    >
      <slot />
    </ContextMenuContent>
  </ContextMenuPortal>
</template>
