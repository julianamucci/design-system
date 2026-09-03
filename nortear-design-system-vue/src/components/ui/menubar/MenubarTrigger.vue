<script setup lang="ts">
import type { MenubarTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { MenubarTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * REABRIR pelo teclado precisa levar o foco para dentro do painel.
 *
 * Medido em 2026-09-03: a PRIMEIRA abertura por teclado põe o foco no primeiro
 * item, como a APG manda. Depois de um Escape, a segunda abertura pelo mesmo
 * gatilho abre o painel e deixa o foco no gatilho — e não é da tecla: Enter,
 * Space e Seta-baixo falham igual, o que descarta a leitura de que fosse
 * particularidade do Space. As outras quatro stacks entram nas três teclas.
 *
 * O mecanismo é da lib: o painel só aceita foco de entrada quando o sinalizador
 * `wasKeyboardTriggerOpenRef` está de pé (`onEntryFocus` cancela o evento se ele
 * estiver baixo), e ele é zerado por um `watch` no fechamento. Na reabertura o
 * sinalizador e a montagem do painel não se encontram no mesmo instante, e o
 * foco de entrada é cancelado.
 *
 * O conserto é aqui e não no painel porque só o gatilho sabe que a abertura veio
 * do TECLADO — mover o foco em abertura por ponteiro seria defeito, não
 * correção: quem clica não quer o foco sequestrado. Por isso a condição exige
 * que o foco ainda esteja no gatilho, o que só acontece no caminho de teclado.
 */
const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const OPENING_KEYS = ['Enter', ' ', 'ArrowDown']

function focusPanelOnKeyboardOpen(event: KeyboardEvent) {
  if (!OPENING_KEYS.includes(event.key)) return
  const trigger = event.currentTarget as HTMLElement | null
  if (!trigger) return

  // Espera o painel montar. Prazo de relógio, e não `waitFor` de observador:
  // a leitura aqui é pura, mas o laço tem de terminar mesmo se nada abrir —
  // gatilho desabilitado, ou a tecla tendo FECHADO o menu.
  const deadline = Date.now() + 1000
  const attempt = () => {
    if (Date.now() > deadline) return
    if (trigger.getAttribute('aria-expanded') !== 'true') {
      requestAnimationFrame(attempt)
      return
    }
    const panel = document.querySelector<HTMLElement>('[data-slot="menubar-content"]')
    if (!panel) {
      requestAnimationFrame(attempt)
      return
    }
    // Já entrou sozinho (primeira abertura): nada a fazer.
    if (panel.contains(document.activeElement)) return
    panel.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }
  requestAnimationFrame(attempt)
}
</script>

<template>
  <MenubarTrigger
    data-slot="menubar-trigger"
    v-bind="forwardedProps"
    :class="cn('nds-menubar-trigger', props.class)"
    @keydown="focusPanelOnKeyboardOpen"
  >
    <slot />
  </MenubarTrigger>
</template>
