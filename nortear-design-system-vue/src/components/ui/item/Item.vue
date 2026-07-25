<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ItemVariants } from './index'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { itemVariants } from './index'

const props = withDefaults(defineProps<PrimitiveProps & {
  class?: HTMLAttributes['class']
  variant?: ItemVariants['variant']
  size?: ItemVariants['size']
}>(), {
  as: 'div',
  variant: 'default',
  size: 'default',
})
</script>

<template>
  <Primitive
    data-slot="item"
    :data-variant="variant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :class="cn(itemVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
