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

const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 0,
})
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>
