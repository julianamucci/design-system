<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CircleIcon } from 'lucide-vue-next'
import {
  RadioGroupIndicator,
  RadioGroupItem,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    data-slot="radio-group-item"
    v-bind="forwardedProps"
    :class="cn( 'nds-radio-item', props.class, )"
  >
    <RadioGroupIndicator
      data-slot="radio-group-indicator"
      class="nds-radio-indicator"
    >
      <slot>
        <CircleIcon />
      </slot>
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
