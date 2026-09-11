<script setup lang="ts">
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'reka-ui'
import { useVModel } from '@vueuse/core'
import { ContextMenuSub } from 'reka-ui'
import { provide } from 'vue'
import { CONTEXT_MENU_SUB_CLOSE } from './context-menu.context'

const props = withDefaults(defineProps<ContextMenuSubProps>(), {
  open: undefined,
})
const emits = defineEmits<ContextMenuSubEmits>()

/**
 * O estado aberto do submenu mora AQUI, e não só na lib — a mesma forma do
 * `ContextMenuSub` da reka (`useVModel`, passivo quando ninguém controla).
 *
 * É o que deixa o painel do submenu fechá-lo sozinho no Escape
 * (`useSubmenuEscape`): o contexto de menu da reka, que tem o `onOpenChange`
 * do submenu, não é exportado. Quem controla por `v-model:open` continua
 * recebendo cada mudança.
 */
const open = useVModel(props, 'open', emits, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
})

provide(CONTEXT_MENU_SUB_CLOSE, () => {
  open.value = false
})
</script>

<template>
  <ContextMenuSub
    v-slot="slotProps"
    v-model:open="open"
    data-slot="context-menu-sub"
  >
    <slot v-bind="slotProps" />
  </ContextMenuSub>
</template>
