<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { SidebarMenuButtonVariants } from './index'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { sidebarMenuButtonVariants } from './index'

export interface SidebarMenuButtonProps extends PrimitiveProps {
  variant?: SidebarMenuButtonVariants['variant']
  size?: SidebarMenuButtonVariants['size']
  isActive?: boolean
  class?: HTMLAttributes['class']
}

// O componente distribui `$attrs` à mão (v-bind abaixo). Sem desligar a
// herança automática, o Vue reaplicaria os mesmos atributos por cima do vnode
// raiz DEPOIS do template — e aí a ordem escrita aqui deixaria de valer.
defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SidebarMenuButtonProps>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
})
</script>

<template>
  <!--
    `data-slot`/`data-sidebar` vêm DEPOIS do v-bind="$attrs" de propósito.
    Quando o item tem tooltip, o gatilho envolve este botão com as-child e
    injeta o próprio data-slot nos atributos herdados; escrito antes, ele
    venceria o merge e o elemento deixaria de se identificar como o botão do
    menu. O elemento é o botão do sidebar — o tooltip é comportamento acoplado
    a ele, não a sua identidade.
  -->
  <Primitive
    :data-size="size"
    :data-active="isActive ? 'true' : undefined"
    :class="cn(sidebarMenuButtonVariants({ variant, size }), props.class)"
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
  >
    <slot />
  </Primitive>
</template>
