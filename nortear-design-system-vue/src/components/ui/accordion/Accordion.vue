<script setup lang="ts">
import type { AccordionRootEmits, AccordionRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AccordionRoot,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

// `collapsible` fica FORA da API pública, de propósito.
//
// A decisão do design system é comportamental: no modo único, clicar de novo
// no item aberto sempre o fecha. Três das cinco stacks rodam libs headless
// (base-ui, bits-ui, radix-ng) cuja máquina de estado do modo único não tem
// esse ramo — fechar é incondicional e não há prop para desligar. O reka é a
// única que tem a chave, e com `false` por padrão: deixá-la exposta faria esta
// stack ser a única capaz de entregar um estado que as outras quatro não
// alcançam, e ainda por omissão. Por isso o `Omit` no tipo (passar a prop vira
// erro de compilação) e o valor fixo no template.
const props = defineProps<Omit<AccordionRootProps, 'collapsible'> & { class?: HTMLAttributes['class'] }>()
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

    `collapsible` fica DEPOIS do v-bind, pelo motivo oposto: não é um default
    negociável, é o comportamento do design system (ver o bloco no script), e o
    reka o desligaria por omissão.
  -->
  <AccordionRoot
    v-slot="slotProps"
    data-slot="accordion"
    :data-type="props.type"
    :unmount-on-hide="false"
    v-bind="forwarded"
    :collapsible="true"
    :class="cn('nds-accordion', props.class)"
  >
    <slot v-bind="slotProps" />
  </AccordionRoot>
</template>
