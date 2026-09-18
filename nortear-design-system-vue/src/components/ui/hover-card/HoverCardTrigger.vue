<script setup lang="ts">
import type { HoverCardTriggerProps } from 'reka-ui'
import { HoverCardTrigger, injectHoverCardRootContext } from 'reka-ui'
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { unrefElement } from '@vueuse/core'
import { KEY_HOVER_CARD } from './context'

const props = defineProps<HoverCardTriggerProps>()

// Registra o elemento real no contexto: é dele que HoverCardContent tira o nome
// acessível do painel. `unrefElement` resolve os dois casos — com `as-child` a
// ref é a instância do componente, sem ele é o próprio elemento.
const referencia = ref<HTMLElement | { $el?: HTMLElement } | null>(null)
const contexto = inject(KEY_HOVER_CARD, null)
const rootContext = injectHoverCardRootContext()

// ─── D12 · só foco VISÍVEL abre o cartão ─────────────────────────────────────
//
// A lib desta stack liga `focus` CRU no gatilho
// (`reka-ui/dist/HoverCard/HoverCardTrigger.js`, `onFocus: () => onOpen()`), então
// qualquer `.focus()` de script armava a abertura. O cartão é apoio pedido por um
// GESTO: foco movido por script é a página se reorganizando, e um painel que
// aparece aí é ruído sobre quem não pediu nada. O Tab continua abrindo, que é o
// caso que a WCAG 1.4.13 cobre.
//
// **Por que ouvinte de DOM e não `@focus` no template**: a reka monta o gatilho
// por `Slot`, que faz `mergeProps(attrs, props do filho)` — o ouvinte vindo do
// template entra ANTES do da lib na lista, e cancelar antes de a lib agendar não
// cancela nada. Registrado aqui, no `onMounted` do invólucro, ele nasce DEPOIS do
// da lib (o Vue liga os ouvintes do elemento durante o patch, antes de qualquer
// `onMounted`), e então `onDismiss` limpa o temporizador que a lib acabou de
// armar, dentro do mesmo evento.
//
// `onDismiss` e não `onClose`: o segundo agenda o fechamento pela espera de
// 300ms, e o que se quer é cancelar a abertura na hora.
function cancelarFocoInvisivel(event: FocusEvent): void {
  const alvo = event.currentTarget as HTMLElement | null
  if (!alvo || alvo.matches(':focus-visible')) return
  // Já aberto por ponteiro: este foco não pediu abertura nenhuma, e dispensar
  // aqui fecharia um cartão que o cursor sustenta.
  if (rootContext.open.value) return
  rootContext.onDismiss()
}

let trigger: HTMLElement | null = null

onMounted(() => {
  trigger = (unrefElement(referencia as never) as HTMLElement) ?? null
  if (contexto) contexto.trigger.value = trigger
  trigger?.addEventListener('focus', cancelarFocoInvisivel)
})

onBeforeUnmount(() => {
  trigger?.removeEventListener('focus', cancelarFocoInvisivel)
  trigger = null
})
</script>

<template>
  <HoverCardTrigger
    ref="referencia"
    data-slot="hover-card-trigger"
    v-bind="props"
  >
    <slot />
  </HoverCardTrigger>
</template>
