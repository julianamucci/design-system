<script setup lang="ts">
import type { AccordionTriggerProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-vue-next'
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
      :class="
        cn(
          'nds-accordion-trigger',
          props.class,
        )
      "
    >
      <slot />
      <slot name="icon">
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          class="nds-accordion-icon nds-accordion-icon-closed"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          class="nds-accordion-icon nds-accordion-icon-open"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
