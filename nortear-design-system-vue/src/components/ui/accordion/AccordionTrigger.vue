<script setup lang="ts">
import type { AccordionTriggerProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDownIcon } from 'lucide-vue-next'
import {
  AccordionHeader,
  AccordionTrigger,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AccordionHeader class="nds-accordion-header">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="cn( 'nds-accordion-trigger', props.class, )"
    >
      <!-- O rótulo vive num <span> próprio: o sublinhado de hover é
           `.nds-accordion-trigger:hover > span:first-child` e não deve
           alcançar os ícones. Mesma marcação nas 4 stacks. -->
      <span><slot /></span>
      <slot name="icon">
        <!-- Um único chevron que gira 180° ao abrir (ver accordion.css). -->
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          class="nds-accordion-icon"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
