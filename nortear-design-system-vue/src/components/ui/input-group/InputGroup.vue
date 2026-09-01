<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * InputGroup — moldura única em volta de campo + acompanhamentos.
 *
 * Visual: classes `.nds-input-group*` de `docs/shared/styles/nds/input-group.css`.
 *
 * A FOLHA É O CONTRATO. O que ela declara, e que este componente só transcreve:
 *
 *   • `.nds-input-group` é a MOLDURA: borda, arredondamento e transição são
 *     dela. Ela acende no foco por `:has(.nds-input-group-control:focus-visible)`,
 *     fica vermelha em `:has([aria-invalid="true"])` e esmaece em
 *     `:has(:disabled)` — nenhum desses três estados é escrito por JS aqui.
 *   • `.nds-input-group-control` é o campo NU: `border: 0` e `box-shadow: none`.
 *     Duas molduras concêntricas no foco é o que essa regra existe para evitar.
 *   • `.nds-input-group-addon` tem `cursor: text` e `user-select: none`, e as
 *     quatro posições saem de `[data-align]`. As duas em bloco (mais a simples
 *     presença de um `<textarea>`) trocam a linha por coluna via `:has()`.
 *   • `.nds-input-group-button` só APERTA a medida; o visual de botão continua
 *     vindo de `.nds-button`.
 *
 * ─── Decisões de acessibilidade ─────────────────────────────────────────────
 *
 * 1. A RAIZ DECLARA `role="group"`, E O NOME É DE QUEM COMPÕE — mas o papel
 *    está declarado aqui de propósito, e não deixado implícito. Em `drawer` e
 *    `sheet` o corpo era um `<div>` sem papel, e `aria-label` num elemento
 *    genérico é simplesmente descartado (`aria-prohibited-attr`): a promessa
 *    "o nome é de quem compõe" não se cumpria. `role="group"` é justamente um
 *    dos papéis que ACEITAM nome, então aqui ela se cumpre.
 *
 * 2. O NOME DO GRUPO É OPCIONAL, e nunca inventado. Com um campo só dentro da
 *    moldura, quem tem nome é o campo, pelo rótulo; nomear o grupo também faz o
 *    leitor de tela dizer as mesmas palavras duas vezes. O nome ganha utilidade
 *    quando a moldura guarda MAIS DE UM controle — campo mais botão de limpar,
 *    por exemplo —, porque aí "grupo" sozinho não diz de que o botão é vizinho.
 *    Por isso ele NÃO é prop declarada: chega como atributo de quem compõe.
 *
 * 3. O ADDON NÃO TEM PAPEL NENHUM — ver `InputGroupAddon.vue`.
 *
 * 6. SEM REGIÃO VIVA. Nada aqui se reanuncia. Quem conta o erro é o texto
 *    ligado ao campo por `aria-describedby`, no momento da validação.
 *
 * 7. SEM ALTURA FIXA (WCAG 1.4.4). A folha usa `height: auto` no addon e tira a
 *    altura do espaço interno mais a entrelinha, então a moldura cresce com o
 *    tamanho de fonte do navegador. Nada aqui escreve altura.
 *
 * 8. ESTADO É PALAVRA, NUNCA SÓ COR (WCAG 1.4.1). Inválido é `aria-invalid` no
 *    CAMPO mais um texto ligado a ele — a moldura vermelha é o eco, não o
 *    aviso. Desabilitado é `disabled` de verdade, que já sai da ordem de
 *    tabulação.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="input-group"
    role="group"
    :class="cn('nds-input-group', props.class)"
  >
    <slot />
  </div>
</template>
