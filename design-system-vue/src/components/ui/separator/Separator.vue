<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Separator } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  asChild?: boolean
  as?: any
}

const props = withDefaults(defineProps<
  SeparatorProps & { class?: HTMLAttributes['class'] }
>(), {
  orientation: 'horizontal',
  decorative: true,
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <Separator
    data-slot="separator"
    v-bind="delegatedProps"
    :aria-hidden="props.decorative ? 'true' : undefined"
    :aria-orientation="!props.decorative ? props.orientation : undefined"
    :class="cn( 'nds-separator', props.class, )"
  />
</template>
