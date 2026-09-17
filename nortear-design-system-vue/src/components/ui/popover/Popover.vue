<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, provide, shallowRef } from 'vue'
import {
  POPOVER_ANCHOR,
  POPOVER_CLOSE_REASON,
  POPOVER_DISMISS,
  POPOVER_MODAL,
  type PopoverCloseReason,
} from './popover.context'

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que o
 * separa do tooltip), mas NÃO fica preso — sair com `Tab` do último focável, ou
 * com `Shift+Tab` do primeiro, FECHA o painel, relatando `overlay`, e DEVOLVE O
 * FOCO AO GATILHO.
 *
 * As metades da frase acima andam juntas (decisão de 2026-09-17), e nenhuma
 * substitui a outra: o foco não ficar preso é o que separa o padrão do modo
 * modal; o fechamento impede um painel órfão aberto atrás de quem já saiu; e a
 * volta ao gatilho dá a quem tabula um ponto de partida conhecido. No modo
 * MODAL não vale nada disso: lá o foco fica preso e não há "sair".
 *
 * E o painel não-modal fica aberto só enquanto o foco está nele (D15, decisão de
 * 2026-09-17): foco levado por código a outro elemento da página FECHA o painel,
 * relatando `overlay`, uma vez — e o foco FICA onde foi posto, sem voltar ao
 * gatilho. O gatilho conta como parte do painel, e clique fora continua sendo um
 * fechamento só. Quem detecta aqui é o `DismissableLayer` da reka; o detalhe está
 * no `PopoverContent.vue`.
 *
 * Por isso o painel só recebe `aria-modal` no modo modal: o atributo manda o
 * leitor de tela esconder o resto da página, e sem foco preso ele mentiria.
 * `Escape` fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho
 * declara `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a rolagem e
 * anuncia `aria-modal`; desde 2026-09-17 também esconde o resto da página do
 * leitor de tela — os quatro juntos. O padrão continua não-modal.
 *
 * Mecanismo desta stack, e é por isso que ela é a REFERÊNCIA do modo modal:
 * o reka-ui é a única das quatro libs que entrega `modal` inteiro sozinha.
 * `PopoverRoot` nasce com `modal: false` e renderiza `PopoverContentNonModal`,
 * que passa `trap-focus: false`; com `modal`, quem renderiza é
 * `PopoverContentModal`, que liga `trap-focus`, `useBodyScrollLock` e
 * `useHideOthers` (este esconde os irmãos por `aria-hidden`, mais forte que
 * `aria-modal`). Nenhum dos dois emite `aria-modal` — esse é nosso, e sai no
 * `PopoverContent.vue`.
 *
 * Esconder o resto da página no modo modal, SEMPRE, é decisão de 2026-09-17
 * igual nas cinco. Aqui a lib esconde; a restauração exata de um
 * `aria-hidden="false"` pré-existente ela não faz, e o complemento está em
 * `popover-aria-hidden-restore.ts`.
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

/**
 * O `close()` que a raiz da reka publica NO SLOT, guardado para quem não o
 * alcança.
 *
 * O painel vive em portal e recebe o slot de quem compõe, não o desta raiz —
 * então ele não tem como chamar o `close` que a lib publica aqui. E ele precisa
 * dele: o `Tab` para fora fecha o painel (ver `PopoverContent.vue`), e esse é o
 * único caminho de fechamento que a reka não dispensa por conta própria.
 *
 * A alternativa seria `injectPopoverRootContext` da lib — e ela é justamente o
 * que o `popover.context.ts` recusa desde o começo: contexto de lib para
 * decisão nossa é o que some numa atualização menor. O `close` do slot é API
 * pública e documentada.
 *
 * Guardado no RENDER, e não num `watch`: `close` é criado a cada render pela
 * raiz da lib, e não é reativo. A função não é lida durante o render — só
 * escrita —, então guardar aqui não realimenta renderização nenhuma.
 */
let libClose: (() => void) | null = null

function withDismiss<T extends { close: () => void }>(slotProps: T): T {
  libClose = slotProps.close
  return slotProps
}

// Anotar e fechar no MESMO gesto: fechar pela raiz é mudar o estado da lib em
// silêncio, e uma anotação que chegasse depois valeria para o fechamento
// seguinte — que é pior do que não anotar.
provide(POPOVER_DISMISS, (reason) => {
  motivoPendente = reason
  libClose?.()
})

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma — é o mesmo
// caminho que o próprio reka-ui usa para levar estado ao conteúdo.
provide(POPOVER_MODAL, computed(() => props.modal === true))

// A âncora do painel, para o `alignOffset` valer com `align="center"` — ver
// `POPOVER_ANCHOR` no `popover.context.ts`.
provide(POPOVER_ANCHOR, { trigger: shallowRef(null), custom: shallowRef(null) })
</script>

<template>
  <!-- Sem `data-slot` aqui: a `PopoverRoot` da reka não renderiza elemento, e o atributo não chegaria ao DOM. -->
  <PopoverRoot
    v-slot="slotProps"
    v-bind="forwardedSemOpen"
    @update:open="aoMudar"
  >
    <slot v-bind="withDismiss(slotProps)" />
  </PopoverRoot>
</template>
