<script setup lang="ts">
import type { AccordionItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { provide, ref } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { ACCORDION_ITEM_IDS } from './accordion-a11y'

const props = defineProps<AccordionItemProps & { class?: HTMLAttributes['class'] }>()

// Ver accordion-a11y.ts: o reka não liga gatilho e painel por id nesta stack.
// O Content publica aqui o id que a lib gerou e o Trigger o consome.
provide(ACCORDION_ITEM_IDS, ref(''))

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <AccordionItem
    v-slot="slotProps"
    data-slot="accordion-item"
    v-bind="forwardedProps"
    :class="cn('nds-accordion-item', props.class)"
  >
    <slot v-bind="slotProps" />
  </AccordionItem>
</template>
