<script lang="ts" setup>
import type { CalendarPrevProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { CalendarPrev, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = defineProps<CalendarPrevProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarPrev
    data-slot="calendar-prev-button"
    :class="cn( buttonVariants({ variant: 'ghost' }), 'nds-calendar-nav-btn', props.class, )"
    v-bind="forwardedProps"
  >
    <slot>
      <ChevronLeftIcon class="nds-calendar-chevron" />
    </slot>
  </CalendarPrev>
</template>
