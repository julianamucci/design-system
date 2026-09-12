<script setup lang="ts">
import type { TooltipProviderProps } from 'reka-ui'
import { TooltipProvider } from 'reka-ui'
//
// Sem `data-slot="tooltip-provider"` de propósito, e não por esquecimento: o
// `TooltipProvider` do reka-ui declara `inheritAttrs: false` e renderiza um
// `<slot />` puro. Não existe elemento onde o atributo pudesse pousar, e criar
// um wrapper só para carimbá-lo colocaria uma caixa no fluxo que o CSS
// `.nds-tooltip-*` não prevê. Divergência de API de framework: registrada, não
// "alinhada".
//

// 300ms é a espera do design system nas cinco stacks, fixada pela dona em
// 2026-09-12 (PRD do tooltip, D5). Zero não é atraso — é ausência de atraso, e
// com ele todo movimento do ponteiro pela barra de ferramentas acende balão. O
// atraso é do PONTEIRO: o foco pelo teclado abre na hora, porque quem chega por
// Tab não tem como "parar em cima" (WCAG 1.4.13). Quem garante isso é a lib, que
// só agenda o temporizador na entrada do ponteiro.
const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 300,
})
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>
