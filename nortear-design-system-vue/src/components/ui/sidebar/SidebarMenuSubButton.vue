<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<PrimitiveProps & {
  size?: 'sm' | 'md'
  isActive?: boolean
  class?: HTMLAttributes['class']
}>(), {
  as: 'a',
  size: 'md',
})
</script>

<template>
  <!--
    data-active vale "true" (e some quando inativo), nunca o atributo vazio:
    é a forma que a folha compartilhada casa e a que as demais implementações
    do design system emitem.
  -->
  <Primitive
    data-slot="sidebar-menu-sub-button"
    data-sidebar="menu-sub-button"
    :as="as"
    :as-child="asChild"
    :data-size="size"
    :data-active="isActive ? 'true' : undefined"
    :class="cn('nds-sidebar-menu-sub-button', props.class)"
  >
    <slot />
  </Primitive>
</template>
