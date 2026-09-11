<script setup lang="ts">
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'reka-ui'
import { useVModel } from '@vueuse/core'
import { ContextMenuSub } from 'reka-ui'
import { provide } from 'vue'
import { MENU_SUB_CLOSE } from '@/components/ui/dropdown-menu/dropdown-menu.context'

const props = withDefaults(defineProps<ContextMenuSubProps>(), {
  open: undefined,
})
const emits = defineEmits<ContextMenuSubEmits>()

/**
 * O estado aberto do submenu mora AQUI, e não só na lib — a mesma forma do
 * `ContextMenuSub` da reka (`useVModel`, passivo quando ninguém controla) e do
 * `DropdownMenuSub` e do `MenubarSub` desta stack.
 *
 * É o que deixa o painel do submenu fechá-lo sozinho no Escape
 * (`useSubmenuEscape`): o contexto de menu da reka, que tem o `onOpenChange`
 * do submenu, não é exportado. Quem controla por `v-model:open` continua
 * recebendo cada mudança.
 *
 * A chave é a MESMA dos outros dois membros (`MENU_SUB_CLOSE`): até 2026-09-11
 * o ContextMenu tinha a própria chave e a própria cópia do ouvinte, e as duas
 * cópias podiam divergir numa correção.
 */
const open = useVModel(props, 'open', emits, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
})

// PATCH: a11y — o Escape do submenu fecha só ele; o estado mora aqui para o painel poder fechá-lo (ver PATCHES.md#vue-menu-submenu-escape)
provide(MENU_SUB_CLOSE, () => {
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
