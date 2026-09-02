<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui'

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL: o foco ENTRA no painel ao abrir (é o que o separa do
 * tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da página. Por isso
 * o painel nunca recebe `aria-modal`: o atributo manda o leitor de tela
 * esconder o resto da página, e sem foco preso ele mentiria. `Escape` fecha e
 * devolve o foco ao gatilho; clique fora fecha; o gatilho declara
 * `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * Mecanismo desta stack: `PopoverRoot` do reka-ui nasce com `modal: false`, e
 * é o `PopoverContentNonModal` que renderiza — ele passa `trap-focus: false`.
 * O caminho modal é outro componente (`PopoverContentModal`), com
 * `useBodyScrollLock` e `useHideOthers`; nenhum dos dois emite `aria-modal`.
 */
const props = defineProps<PopoverRootProps>()
const emits = defineEmits<PopoverRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <PopoverRoot
    v-slot="slotProps"
    data-slot="popover"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>
