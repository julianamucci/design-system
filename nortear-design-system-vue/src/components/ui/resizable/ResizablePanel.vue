<script setup lang="ts">
import type { SplitterPanelEmits, SplitterPanelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SplitterPanel, useForwardExpose, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SplitterPanelProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<SplitterPanelEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
useForwardExpose()
</script>

<template>
  <!--
    `nds-resizable-panel` é o contrato de markup que as cinco stacks
    compartilham e que a auditoria compara. Faltava aqui: a sonda achou o painel
    só pelo `data-slot`, e nenhuma regra da folha compartilhada alcançava o
    elemento. A medida do eixo principal continua vindo do primitivo, em `style`
    inline, que vence a classe — a classe traz identidade, não tamanho.
  -->
  <SplitterPanel
    v-slot="slotProps"
    data-slot="resizable-panel"
    v-bind="forwarded"
    :class="cn('nds-resizable-panel', props.class)"
  >
    <slot v-bind="slotProps" />
  </SplitterPanel>
</template>
