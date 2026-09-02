<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, provide } from 'vue'
import { POPOVER_MODAL } from './popover.context'

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que o
 * separa do tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da página.
 * Por isso o painel só recebe `aria-modal` no modo modal: o atributo manda o
 * leitor de tela esconder o resto da página, e sem foco preso ele mentiria.
 * `Escape` fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho
 * declara `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a rolagem e
 * anuncia `aria-modal`, os três juntos. O padrão continua não-modal.
 *
 * Mecanismo desta stack, e é por isso que ela é a REFERÊNCIA do modo modal:
 * o reka-ui é a única das quatro libs que entrega `modal` inteiro sozinha.
 * `PopoverRoot` nasce com `modal: false` e renderiza `PopoverContentNonModal`,
 * que passa `trap-focus: false`; com `modal`, quem renderiza é
 * `PopoverContentModal`, que liga `trap-focus`, `useBodyScrollLock` e
 * `useHideOthers` (este esconde os irmãos por `aria-hidden`, mais forte que
 * `aria-modal`). Nenhum dos dois emite `aria-modal` — esse é nosso, e sai no
 * `PopoverContent.vue`.
 */
const props = defineProps<PopoverRootProps>()
const emits = defineEmits<PopoverRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma — é o mesmo
// caminho que o próprio reka-ui usa para levar estado ao conteúdo.
provide(POPOVER_MODAL, computed(() => props.modal === true))
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
