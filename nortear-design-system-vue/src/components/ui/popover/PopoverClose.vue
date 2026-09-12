<script setup lang="ts">
import type { PopoverCloseProps } from 'reka-ui'
import { inject } from 'vue'
import { PopoverClose } from 'reka-ui'
import { POPOVER_CLOSE_REASON } from './popover.context'

/**
 * Controle de fechar POR DENTRO do painel — o Cancelar do rodapé.
 *
 * Quem fecha é a lib: `PopoverClose` da reka-ui liga o próprio `onClick` ao
 * `onOpenChange(false)` da raiz. O que esta peça acrescenta é a ANOTAÇÃO do
 * motivo, porque a reka não publica motivo nenhum em `update:open` — mesmo
 * caminho que o painel (`escape`, `overlay`) e o gatilho (`overlay`) já usam.
 */

const props = defineProps<PopoverCloseProps>()

// Anota o motivo para a raiz; inerte quando a peça é usada sem ela.
const anotarMotivo = inject(POPOVER_CLOSE_REASON, () => {})
</script>

<template>
  <!--
    A anotação vai na FASE DE CAPTURA, e isso não é preciosismo.

    A raiz lê `motivoPendente` no instante em que emite `update:open`, então a
    anotação precisa acontecer ANTES do handler que fecha. E o handler que fecha
    é o da lib, que nasce primeiro: o `@click` desta peça chega ao `<button>` por
    fallthrough e o `mergeProps` do Vue concatena na ordem
    `[handler da lib, o nosso]` — ou seja, com `@click` simples a raiz emitiria
    `api` e a nossa anotação chegaria para o fechamento SEGUINTE, que é pior do
    que não anotar.

    `@click.capture` vira uma escuta separada (`onClickCapture`, registrada com
    `capture: true`). No alvo, o DOM invoca as escutas de captura na passagem de
    captura e as de bolha na passagem de bolha — a de captura vem antes, mesmo
    tendo sido registrada depois. É o único ponto em que dá para entrar na
    frente da lib sem depender de contexto interno dela.

    Enter e Espaço passam pelo mesmo caminho: o navegador despacha um `click`
    real no botão, e ele também atravessa a captura.
  -->
  <PopoverClose
    data-slot="popover-close"
    v-bind="props"
    @click.capture="anotarMotivo('close-button')"
  >
    <slot />
  </PopoverClose>
</template>
