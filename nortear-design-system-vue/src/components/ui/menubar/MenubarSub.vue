<script setup lang="ts">
import type { MenubarSubEmits } from 'reka-ui'
import { useVModel } from '@vueuse/core'
import { MenubarSub } from 'reka-ui'
import { provide } from 'vue'
import { MENU_SUB_CLOSE } from '@/components/ui/dropdown-menu/dropdown-menu.context'

interface MenubarSubRootProps {
  defaultOpen?: boolean
  open?: boolean
}

const props = withDefaults(defineProps<MenubarSubRootProps>(), {
  open: undefined,
})
const emits = defineEmits<MenubarSubEmits>()

/**
 * O estado aberto do submenu mora AQUI, e não só na lib — a mesma forma do
 * `MenubarSub` da reka (`useVModel`, passivo quando ninguém controla) e do
 * `DropdownMenuSub` desta stack.
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

// PATCH: a11y — o Escape do submenu fecha só ele; o estado mora aqui para o painel poder fechá-lo (ver PATCHES.md#vue-menu-submenu-escape)
provide(MENU_SUB_CLOSE, () => {
  open.value = false
})
</script>

<template>
  <MenubarSub
    v-slot="slotProps"
    v-model:open="open"
    data-slot="menubar-sub"
  >
    <slot v-bind="slotProps" />
  </MenubarSub>
</template>
