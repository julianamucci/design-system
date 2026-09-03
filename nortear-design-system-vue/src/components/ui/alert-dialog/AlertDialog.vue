<script setup lang="ts">
/**
 * O modal que NÃO pode ser dispensado por engano.
 *
 * O bloco canônico da divergência com o Dialog está no cabeçalho do
 * `alert-dialog.ts` do Vanilla; aqui fica a versão curta mais o mecanismo
 * desta stack.
 *
 *   · PAPEL: `alertdialog`, e não `dialog` — o `AlertDialogContent` do
 *     primitivo passa `role: "alertdialog"` ao `DialogContent`.
 *   · CLIQUE NO VÉU NÃO FECHA: o mesmo componente previne
 *     `pointerDownOutside` e `interactOutside`. Não é prop de quem consome.
 *   · ESCAPE FECHA, e equivale a cancelar — a camada de dispensa do Dialog
 *     continua valendo.
 *   · O foco entra no CANCEL: `onOpenAutoFocus` do primitivo o busca por
 *     contexto. Num diálogo de destruição, o Enter por reflexo tem de cair na
 *     saída segura.
 *
 * Corolário: a saída visível é o par Cancel + Action do rodapé, e por isso o
 * rodapé não é opcional aqui — este componente não tem X no canto.
 */
import type { AlertDialogEmits, AlertDialogProps } from 'reka-ui'
import { AlertDialogRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<AlertDialogProps>()
const emits = defineEmits<AlertDialogEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <AlertDialogRoot
    v-slot="slotProps"
    data-slot="alert-dialog"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </AlertDialogRoot>
</template>
