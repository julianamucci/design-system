<script setup lang="ts">
import type { HoverCardRootEmits, HoverCardRootProps } from 'reka-ui'
import { HoverCardRoot, useForwardPropsEmits } from 'reka-ui'
import { provide, ref } from 'vue'
import { CHAVE_HOVER_CARD } from './context'

// Espera padrão do design system: 600ms para abrir, 300ms para fechar. A reka
// traz 700/300; o valor é fixado aqui para as cinco stacks abrirem no mesmo
// tempo, que é o que o conteúdo compartilhado documenta.
const props = withDefaults(defineProps<HoverCardRootProps>(), {
  openDelay: 600,
  closeDelay: 300,
})
const emits = defineEmits<HoverCardRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

// O gatilho é registrado por HoverCardTrigger e lido por HoverCardContent, que
// tira dele o nome acessível do painel. Buscar o gatilho no documento daria o
// mesmo nome a todos os cartões de uma tela com vários (ver a story Sides).
const gatilho = ref<HTMLElement | null>(null)
provide(CHAVE_HOVER_CARD, { gatilho })
</script>

<template>
  <HoverCardRoot
    v-slot="slotProps"
    data-slot="hover-card"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </HoverCardRoot>
</template>
