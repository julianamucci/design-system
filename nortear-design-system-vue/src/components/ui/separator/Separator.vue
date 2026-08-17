<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Separator } from 'reka-ui'
import { cn } from '@/lib/utils'

export type SeparatorEmphasis = 'default' | 'strong'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  /** `strong` dobra a espessura e troca o token de cor da linha. */
  emphasis?: SeparatorEmphasis
  asChild?: boolean
  as?: any
}

const props = withDefaults(defineProps<
  SeparatorProps & { class?: HTMLAttributes['class'] }
>(), {
  orientation: 'horizontal',
  decorative: true,
  emphasis: 'default',
})

const delegatedProps = reactiveOmit(props, 'class', 'emphasis')
</script>

<template>
  <Separator
    data-slot="separator"
    v-bind="delegatedProps"
    :aria-hidden="props.decorative ? 'true' : undefined"
    :aria-orientation="!props.decorative ? props.orientation : undefined"
    :data-emphasis="props.emphasis === 'strong' ? 'strong' : undefined"
    :class="cn( 'nds-separator', props.class, )"
  />
</template>
