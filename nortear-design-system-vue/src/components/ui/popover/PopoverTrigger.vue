<script setup lang="ts">
import type { PopoverTriggerProps } from 'reka-ui'
import type { ComponentPublicInstance } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PopoverTrigger } from 'reka-ui'

const props = defineProps<PopoverTriggerProps>()

const triggerRef = ref<ComponentPublicInstance | null>(null)
let observer: MutationObserver | null = null

// `aria-controls` VAZIO é pior que ausente.
//
// A lib escreve `aria-controls=""` no gatilho: ele declara controlar alguma
// coisa e não nomeia nada, então o leitor de tela anuncia uma relação que não
// leva a lugar nenhum. Aberto, o atributo passa a apontar para o id real do
// painel; fechado, ele sai — apontar para um id que não existe reprovaria em
// aria-valid-attr-value. É o mesmo contrato das outras stacks.
// O painel monta QUADROS depois de `aria-expanded` virar `true` — e com
// `defaultOpen` ele já nasce expandido, sem mudança de atributo nenhuma para
// observar. Por isso a correção reexecuta por quadro enquanto o painel não
// aparece, com teto para não deixar laço rodando num popover que fechou no meio
// do caminho.
function corrigir(trigger: HTMLElement, tentativa = 0): void {
  if (!trigger.isConnected || tentativa > 10) return
  if (trigger.getAttribute('aria-expanded') !== 'true') {
    if (trigger.hasAttribute('aria-controls')) trigger.removeAttribute('aria-controls')
    return
  }
  const panel = trigger.ownerDocument.querySelector<HTMLElement>('[data-slot="popover-content"]')
  if (!panel?.id) {
    requestAnimationFrame(() => corrigir(trigger, tentativa + 1))
    return
  }
  if (trigger.getAttribute('aria-controls') !== panel.id) {
    trigger.setAttribute('aria-controls', panel.id)
  }
}

onMounted(async () => {
  await nextTick()
  const trigger = triggerRef.value?.$el as HTMLElement | undefined
  if (!trigger || trigger.nodeType !== Node.ELEMENT_NODE) return
  corrigir(trigger)
  // O painel monta um quadro depois de `aria-expanded` virar `true`, então o
  // observador reexecuta a correção a cada mudança dos dois atributos.
  observer = new MutationObserver(() => corrigir(trigger))
  observer.observe(trigger, {
    attributes: true,
    attributeFilter: ['aria-expanded', 'aria-controls'],
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <PopoverTrigger
    ref="triggerRef"
    data-slot="popover-trigger"
    v-bind="props"
  >
    <slot />
  </PopoverTrigger>
</template>
