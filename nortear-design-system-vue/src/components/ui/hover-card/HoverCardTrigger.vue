<script setup lang="ts">
import type { HoverCardTriggerProps } from 'reka-ui'
import { HoverCardTrigger } from 'reka-ui'
import { inject, onMounted, ref } from 'vue'
import { unrefElement } from '@vueuse/core'
import { KEY_HOVER_CARD } from './context'

const props = defineProps<HoverCardTriggerProps>()

// Registra o elemento real no contexto: é dele que HoverCardContent tira o nome
// acessível do painel. `unrefElement` resolve os dois casos — com `as-child` a
// ref é a instância do componente, sem ele é o próprio elemento.
const referencia = ref<HTMLElement | { $el?: HTMLElement } | null>(null)
const contexto = inject(KEY_HOVER_CARD, null)

onMounted(() => {
  if (contexto) contexto.trigger.value = (unrefElement(referencia as never) as HTMLElement) ?? null
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
