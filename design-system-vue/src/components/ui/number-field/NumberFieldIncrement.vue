<script setup lang="ts">
import type { NumberFieldIncrementProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PlusIcon } from 'lucide-vue-next'
import { NumberFieldIncrement, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NumberFieldIncrementProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldIncrement
    data-slot="increment"
    v-bind="forwarded"
    :class="cn('nds-number-field-increment', props.class)"
  >
    <slot>
      <PlusIcon />
    </slot>
  </NumberFieldIncrement>
</template>
