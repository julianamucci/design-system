<script setup lang="ts">
import type { NumberFieldDecrementProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { MinusIcon } from 'lucide-vue-next'
import { NumberFieldDecrement, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NumberFieldDecrementProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldDecrement
    data-slot="decrement"
    v-bind="forwarded"
    :class="cn('nds-number-field-decrement', props.class)"
  >
    <slot>
      <MinusIcon />
    </slot>
  </NumberFieldDecrement>
</template>
