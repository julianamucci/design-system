<script lang="ts" setup>
import type { StepperIndicatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { StepperIndicator, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperIndicator
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn( 'nds-stepper-indicator', // Disabled '', // Active '', // Completed props.class, )"
  >
    <slot v-bind="slotProps" />
  </StepperIndicator>
</template>
