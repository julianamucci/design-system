<script setup lang="ts">
import type { ContextMenuRootProps } from 'reka-ui'
import { ContextMenuRoot, useForwardProps } from 'reka-ui'
import { provide } from 'vue'
import { CONTEXT_MENU_CLOSE, type ContextMenuCloseReason } from './context-menu.context'

const props = defineProps<ContextMenuRootProps>()

/**
 * `update:open` ganha o MOTIVO como segundo argumento no fechamento — a forma
 * que o Popover desta stack já tem, e a que base-ui (`onOpenChange(open,
 * detalhes)`) e radix-ng (`evento.reason`) entregam de fábrica. O motivo viaja
 * junto com a mudança de estado DAQUELA instância, e é ele que o
 * `context_menu_close` precisa: sem ele a docs page mandaria o fechamento sem
 * `reason` ou inventaria um.
 */
const emits = defineEmits<{
  'update:open': [value: boolean, reason?: ContextMenuCloseReason]
}>()

const forwarded = useForwardProps(props)

let pendingReason: ContextMenuCloseReason | null = null

function handleOpenChange(open: boolean) {
  // `api` é o padrão: é o que sobra quando nenhum gesto de saída foi visto — a
  // escolha de um item, ou o fechamento pelo código.
  const reason = open ? undefined : (pendingReason ?? 'api')
  // Limpa nos dois sentidos: uma anotação que não resultou em fechamento não
  // pode vazar para o próximo.
  pendingReason = null
  emits('update:open', open, reason)
}

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma — é o mesmo
// caminho que a própria reka-ui usa para levar estado ao conteúdo. O destino do
// Tab não passa por aqui: ele mora no mecanismo compartilhado com o
// DropdownMenu (`useTabLeavesMenu`).
provide(CONTEXT_MENU_CLOSE, {
  note: (reason) => { pendingReason = reason },
})
</script>

<template>
  <ContextMenuRoot
    data-slot="context-menu"
    v-bind="forwarded"
    @update:open="handleOpenChange"
  >
    <slot />
  </ContextMenuRoot>
</template>
