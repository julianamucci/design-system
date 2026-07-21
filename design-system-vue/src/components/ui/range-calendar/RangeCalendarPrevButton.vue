<script lang="ts" setup>
import type { RangeCalendarPrevProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { RangeCalendarPrev, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = defineProps<RangeCalendarPrevProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarPrev
    data-slot="range-calendar-prev-button"
    :class="cn(
      buttonVariants({ variant: 'outline' }),
      'absolute left-1',
      'nds-calendar-nav-btn',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot>
      <ChevronLeftIcon class="nds-size-4" />
    </slot>
  </RangeCalendarPrev>
</template>
