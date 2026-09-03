<script setup lang="ts">
/**
 * Diálogo modal comum.
 *
 * O bloco canônico da decisão de acessibilidade (dez itens, medidos na fonte
 * das cinco libs) está no cabeçalho do `dialog.ts` do Vanilla; aqui fica a
 * versão curta mais o mecanismo desta stack.
 *
 * Prende o foco, trava a rolagem da página, fecha por Escape E por clique no
 * véu, e devolve o foco ao gatilho. Mecanismo: `DialogContentModal` liga o
 * trap-focus ao `open` e o `DialogOverlayImpl` chama `useBodyScrollLock`;
 * o `DialogTrigger` do primitivo emite `aria-haspopup="dialog"` e
 * `aria-expanded` sozinho. O `aria-modal` NÃO vem da lib (conferido em
 * node_modules) — quem o escreve é o `DialogContent` deste diretório.
 *
 * O que o separa do AlertDialog: papel `dialog` contra `alertdialog`, e o
 * clique no véu FECHA aqui e não fecha lá — o `AlertDialogContent` do
 * reka-ui previne `pointerDownOutside` e `interactOutside`, porque a
 * decisão é crítica e exige escolha explícita. Escape fecha nos dois.
 */
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { DialogRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot
    v-slot="slotProps"
    data-slot="dialog"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>
