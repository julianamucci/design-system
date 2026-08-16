<script setup lang="ts">
import type { MenubarItemEmits, MenubarItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  MenubarItem,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

// `variant` com padrão explícito: sem ele o `data-variant` só aparecia no item
// destrutivo, e o item neutro saía sem marcador nenhum — divergindo do markup
// das outras stacks e deixando o CSS sem seletor para o estado padrão.
const props = withDefaults(
  defineProps<MenubarItemProps & {
    class?: HTMLAttributes['class']
    inset?: boolean
    variant?: 'default' | 'destructive'
  }>(),
  { variant: 'default' },
)

const emits = defineEmits<MenubarItemEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'inset', 'variant')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <MenubarItem
    data-slot="menubar-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-item', props.class)"
  >
    <slot />
  </MenubarItem>
</template>
