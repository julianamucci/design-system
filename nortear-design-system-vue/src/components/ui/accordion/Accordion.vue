<script setup lang="ts">
import type { AccordionRootEmits, AccordionRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AccordionRoot,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<AccordionRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <!--
    `unmount-on-hide="false"` é o default desta stack: o reka só emite
    `hidden="until-found"` no painel quando ele permanece montado, e é isso que
    deixa o Ctrl+F do navegador achar a resposta dentro do item fechado e
    abri-lo (`beforematch`). Passar `true` desliga a busca — em silêncio.
    Fica antes do v-bind para o consumidor ainda poder sobrescrever.
  -->
  <AccordionRoot
    v-slot="slotProps"
    data-slot="accordion"
    :data-type="props.type"
    :data-collapsible="String(props.collapsible ?? false)"
    :unmount-on-hide="false"
    v-bind="forwarded"
    :class="cn('nds-accordion', props.class)"
  >
    <slot v-bind="slotProps" />
  </AccordionRoot>
</template>
