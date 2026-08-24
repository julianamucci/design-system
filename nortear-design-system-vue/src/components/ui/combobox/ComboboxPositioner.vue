<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { injectComboboxRootContext } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

/*
 * Some do DOM com a lista fechada: uma caixa vazia com borda continuaria
 * desenhada, e a folha compartilhada não tem estado fechado para esconder.
 *
 * A caixa fica ANCORADA no fluxo, abaixo do campo, e não em camada flutuante —
 * é o que a folha compartilhada define (`.nds-combobox-positioner` só isola o
 * empilhamento) e o que a referência Vanilla emite. Por isso a lista não usa
 * portal nem posicionamento flutuante da lib.
 */
const rootContext = injectComboboxRootContext()
</script>

<template>
  <div
    v-if="rootContext.open.value"
    data-slot="combobox-positioner"
    :class="cn('nds-combobox-positioner', props.class)"
  >
    <slot />
  </div>
</template>
