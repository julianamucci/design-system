<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ContextMenuItem,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ContextMenuItemProps & {
  class?: HTMLAttributes['class']
  inset?: boolean
  variant?: 'default' | 'destructive'
}>(), {
  variant: 'default',
})
const emits = defineEmits<ContextMenuItemEmits>()

// `inset` e `variant` são NOSSOS, e saem daqui como `data-inset`/`data-variant`
// — que é o que a folha lê. Repassados à lib, caíam no DOM como atributo cru:
// `variant="default"` e `inset="false"` em todo item, markup que o design
// system não define (o `DropdownMenuItem` desta stack já os retirava).
const delegatedProps = reactiveOmit(props, 'inset', 'variant', 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-item', props.class)"
  >
    <slot />
  </ContextMenuItem>
</template>
