<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

// ─── Aba desabilitada: `aria-disabled`, nunca o `disabled` do primitivo ───────
//
// O padrão WAI-ARIA para `tab` manda a aba desabilitada continuar alcançável
// pela seta, para que o leitor de tela a anuncie como indisponível. `disabled`
// nativo faz o oposto: some do alcance do foco.
//
// Duas coisas medidas na fonte da lib, e é o que obriga a NÃO repassar a prop:
//
// 1. O primitivo liga a prop ao atributo `disabled` nativo do botão.
// 2. O item de foco itinerante escolhe os candidatos filtrando pelo DOM
//    (`filter(i => i.dataset.disabled !== '')`), e emite `data-disabled` a
//    partir da mesma prop. Ou seja: `data-disabled` na aba faz a seta pular por
//    cima dela. Por isso este stack não emite `data-disabled` na aba
//    desabilitada — emiti-lo desfaria exatamente a decisão que ele implementa.
//    `aria-disabled` é o atributo que as cinco stacks compartilham, e é ele que
//    a asserção verifica.
//
// Quem barra a ATIVAÇÃO é a guarda em fase de captura de `TabsList.vue`.
const delegatedProps = reactiveOmit(props, 'class', 'disabled')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :class="cn( 'nds-tabs-trigger', props.class, )"
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
