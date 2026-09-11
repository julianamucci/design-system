<script setup lang="ts">
/**
 * CONTRATO DE ACESSIBILIDADE DO MENU — versão curta; o bloco canônico, com a
 * medição das cinco stacks, está no cabeçalho do `dropdown-menu` do Vanilla.
 *
 * Cumprido igual em todas: `aria-haspopup="menu"` + `aria-expanded` no gatilho;
 * `role="menu"` no painel e `menuitem` / `menuitemcheckbox` / `menuitemradio`
 * nos itens; setas, `Home`/`End` e typeahead; `Escape` fecha e devolve o foco ao
 * gatilho; nenhuma região viva.
 *
 * O item DESABILITADO: a seta POUSA nele. Decisão do design system tomada em
 * 2026-09-02 e válida nas cinco stacks — a WAI-ARIA APG pede que o item
 * desabilitado siga alcançável pela seta para ser ANUNCIADO, porque tirá-lo da
 * roda esconde de quem navega de ouvido que a opção existe e está indisponível.
 * O que ele não faz é ATIVAR.
 *
 * MECANISMO DESTA STACK: a lib pulava o item, e nenhuma prop invertia isso — em
 * `Menu/MenuContentImpl` os dois pontos de navegação chamam
 * `useArrowNavigation` com
 * `attributeName: '[data-reka-collection-item]:not([data-disabled])'`. O
 * alinhamento é por PATCH (`patches/reka-ui+2.10.3.patch`), que tira o
 * `:not([data-disabled])` dos dois. Como o nome do arquivo carrega a versão, um
 * bump o desliga em silêncio: quem reprova nesse caso é
 * `src/lib/patches-aplicados.test.ts`. A story `ItemDisabled` aperta a seta e
 * verifica onde o foco pousa. Medido na fonte em 2026-09-02.
 */
import type { DropdownMenuRootProps } from 'reka-ui'
import { DropdownMenuRoot, useForwardProps } from 'reka-ui'
import { provide } from 'vue'
import { DROPDOWN_MENU_CLOSE, type DropdownMenuCloseReason } from './dropdown-menu.context'

const props = defineProps<DropdownMenuRootProps>()

/**
 * `update:open` ganha o MOTIVO como segundo argumento no fechamento — a forma
 * que o ContextMenu e o Popover desta stack já têm, e a que base-ui
 * (`onOpenChange(open, detalhes)`) e radix-ng (`evento.reason`) entregam de
 * fábrica. O motivo viaja junto com a mudança de estado DAQUELA instância, e é
 * ele que o `dropdown_menu_close` precisa: sem ele a docs page mandaria o
 * fechamento sem `reason` ou inventaria um.
 */
const emits = defineEmits<{
  'update:open': [value: boolean, reason?: DropdownMenuCloseReason]
}>()

// Só as props: `update:open` quem emite é `handleOpenChange`, com o motivo.
// Repassá-lo também faria o consumidor receber cada mudança duas vezes.
const forwarded = useForwardProps(props)

let pendingReason: DropdownMenuCloseReason | null = null

function handleOpenChange(open: boolean) {
  // `api` é o padrão: é o que sobra quando nenhum gesto de saída foi visto, e o
  // caminho assim é a escolha de um item (ou o fechamento pelo código).
  const reason = open ? undefined : (pendingReason ?? 'api')
  // Limpa nos dois sentidos: uma anotação que não resultou em fechamento não
  // pode vazar para o próximo.
  pendingReason = null
  emits('update:open', open, reason)
}

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma — é o mesmo
// caminho que a própria reka-ui usa para levar estado ao conteúdo.
provide(DROPDOWN_MENU_CLOSE, {
  note: (reason) => { pendingReason = reason },
})
</script>

<template>
  <DropdownMenuRoot
    v-slot="slotProps"
    data-slot="dropdown-menu"
    v-bind="forwarded"
    @update:open="handleOpenChange"
  >
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
