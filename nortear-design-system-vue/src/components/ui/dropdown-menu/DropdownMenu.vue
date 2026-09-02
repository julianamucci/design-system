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
import type { DropdownMenuRootEmits, DropdownMenuRootProps } from 'reka-ui'
import { DropdownMenuRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DropdownMenuRootProps>()
const emits = defineEmits<DropdownMenuRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuRoot
    v-slot="slotProps"
    data-slot="dropdown-menu"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
