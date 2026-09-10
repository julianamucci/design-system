<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, provide } from 'vue'
import { POPOVER_CLOSE_REASON, POPOVER_MODAL, type PopoverCloseReason } from './popover.context'

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
// `update:open` ganha o MOTIVO como segundo argumento no fechamento. É a forma
// que base-ui (`onOpenChange(open, detalhes)`) e radix-ng (`evento.reason`) já
// têm: o motivo viaja junto com a mudança de estado DAQUELA instância.
const emits = defineEmits<
  Omit<PopoverRootEmits, 'update:open'> & {
    'update:open': [value: boolean, reason?: PopoverCloseReason]
  }
>()

const forwarded = useForwardPropsEmits(props, emits)

// `update:open` sai do repasse automático: quem o emite agora é `aoMudar`, com
// o motivo. Deixá-lo nos dois lugares faria o consumidor receber duas vezes.
const forwardedSemOpen = computed(() => {
  const { 'onUpdate:open': _ignorado, ...resto } = forwarded.value as Record<string, unknown>
  return resto
})

let motivoPendente: PopoverCloseReason | null = null

function aoMudar(open: boolean) {
  // `api` é o padrão para o que não foi gesto — o formulário que salvou e
  // fechou cai aqui, e é por isso que o padrão NÃO é `close-button` como no
  // drawer: com ele, "concluiu" chegaria ao relatório como "apertou fechar".
  const reason = open ? undefined : (motivoPendente ?? 'api')
  // Limpa nos dois sentidos: uma anotação que não resultou em fechamento (o
  // Escape de outro controle, por exemplo) não pode vazar para o próximo.
  motivoPendente = null
  emits('update:open', open, reason)
}

provide(POPOVER_CLOSE_REASON, (reason) => { motivoPendente = reason })

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma — é o mesmo
// caminho que o próprio reka-ui usa para levar estado ao conteúdo.
provide(POPOVER_MODAL, computed(() => props.modal === true))
</script>

<template>
  <PopoverRoot
    v-slot="slotProps"
    data-slot="popover"
    v-bind="forwardedSemOpen"
    @update:open="aoMudar"
  >
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>
