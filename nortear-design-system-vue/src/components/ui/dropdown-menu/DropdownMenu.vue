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
 * MECANISMO DESTA STACK: o item DESABILITADO SAI do percurso das setas. Em
 * `Menu/MenuContentImpl` o RovingFocusGroup coleta candidatos por
 * `attributeName: '[data-reka-collection-item]:not([data-disabled])'`, e
 * `Menu/utils` já traz `Home` e `End` em `FIRST_KEYS`/`LAST_KEYS`. Duas das
 * cinco stacks fazem o contrário e nenhuma prop inverte isso; a story
 * `ItemDisabled` assere o que ESTA lib faz. Medido na fonte em 2026-09-02.
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
