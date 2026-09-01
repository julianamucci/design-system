<script lang="ts">
/**
 * O tempo de uma execução repartido entre trechos que se aninham e se
 * sobrepõem: uma linha por trecho, uma barra POSICIONADA no eixo comum, e o
 * recuo dizendo quem está dentro de quem.
 *
 * Desenho em `nds/resposta-estruturada.css`, no bloco "Cascata de trechos", que
 * também guarda as oito decisões de acessibilidade e as seis regras da família.
 * O vocabulário — `TraceSpan` — vem de `@shared/primitives/chat-protocol`, e a
 * conta de `@shared/primitives/trace-waterfall-axis`.
 *
 * POR QUE ELA É PEÇA, e não a barra de progresso numa tabela. O que decide é o
 * COMEÇO. Medido no repositório antes de construir: `.nds-progress-indicator`
 * é `transform: translateX(calc((var(--value) - 100) * 1%))` — uma barra
 * ANCORADA NO ZERO por construção, que não tem como começar no meio de um
 * eixo. E a medição do tempo de uma resposta, na família 5, não tem eixo
 * nenhum: é um `<dl>` de pares termo/valor. Barra com começo é outro desenho,
 * não outra variante.
 *
 * O EIXO CHEGA DE FORA, e não é derivado dos trechos. É ele que faz as barras
 * dividirem uma régua só, e é ele que continua sendo o total verdadeiro quando
 * quem monta mostra apenas parte do rastro — derivado, ele encolheria a cada
 * trecho retirado e as barras restantes reescalariam, perdendo exatamente a
 * posição que a peça existe para mostrar (§2 da guideline 17, regra 1 da
 * folha).
 *
 * A PEÇA NÃO ORDENA. Os trechos saem na ordem em que foram declarados, e não
 * ordenados por começo: a ordem no DOM é a ordem de leitura (WCAG 1.3.2), e
 * ordenar seria a peça reescrevendo o rastro de quem monta.
 *
 * O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá em curso,
 * concluído e falhou são três desenhos, e o que se perde é `pending`: o trecho
 * que ainda não começou, que num eixo de tempo é justamente o que se quer ver.
 *
 * O RÓTULO NÃO QUEBRA, e essa é a divergência deliberada em relação ao grafo,
 * onde ele quebra. Lá o nó é uma caixa numa casa de grade cuja largura é a do
 * rótulo; aqui a linha tem largura de sobra à direita, e quebrar o rótulo
 * faria a linha crescer em altura e desalinhar a régua da vizinha. Rótulo
 * longo ALARGA a coluna — cortar, nunca: um trecho pela metade é um nome pela
 * metade.
 *
 * NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da folha).
 * Quem quer revelar aos poucos passa MENOS trechos, e o eixo continua o mesmo.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, e ela é uma só: a CLASSE EXTRA entra por
 * atributo de repasse, e não por uma propriedade `class` declarada — mesma
 * decisão já registrada no `flow-graph` desta stack. É a forma desta stack: o
 * Vue funde `class` e `style` de quem chama na raiz do componente sozinho, e
 * declarar a propriedade tiraria a fusão em vez de acrescentar coisa alguma.
 * É o mesmo caminho por onde a story dos limites aperta
 * `--trace-waterfall-name-min` no próprio elemento. O resto do contrato — os
 * trechos, o eixo, o estado e os rótulos — não diverge.
 *
 * O QUE O COMPONENTE NÃO FAZ: ordenar, derivar o eixo, medir elemento, animar,
 * contar tempo, avançar sozinho, buscar nada. Ele desenha os trechos que
 * recebe na régua que recebe.
 */
import type { ToolCallState } from '@shared/primitives/chat-protocol'

export interface TraceWaterfallLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão da família. A cascata é mais larga que a
   * conversa, então ela rola, e o que rola é parada de teclado com
   * `tabindex="0"` — sem nome, quem chega ali ouvindo não sabe onde entrou
   * (regra 6 da §8 da guideline 17). Quem monta é quem sabe o nome: duas
   * peças destas na mesma tela com o mesmo nome são duas paradas
   * indistinguíveis.
   */
  region: string
  /**
   * A régua dita em palavras. `{total}` vira o eixo declarado.
   *
   * VISÍVEL, e é decisão: sem ela, "todas as barras contra o mesmo eixo" é
   * uma afirmação que só quem escreveu o dado consegue conferir.
   */
  axis: string
  /** A duração de cada linha, visível. `{duration}` vira o número. */
  duration: string
  /**
   * A posição no eixo, para quem não vê a barra. `{start}` e `{duration}`
   * viram os números.
   *
   * É o que faz a cascata inteira se reconstruir de ouvido: percorrida a
   * lista, cada trecho disse onde está, e a sobreposição entre dois deles é
   * dedutível dos números.
   */
  reading: string
  /**
   * A frase do trecho que não coube no eixo declarado.
   *
   * Existe porque a barra recortada é uma AFIRMAÇÃO A MENOS: quem vê nota que
   * ela encosta na borda; quem ouve receberia a duração inteira sem saber que
   * só parte dela está desenhada.
   */
  clipped: string
  /**
   * A palavra de cada estado, que é o que chega a quem ouve.
   *
   * A forma resolve para quem vê — a marca ao lado do rótulo e o
   * preenchimento da barra —, e a palavra resolve para quem ouve. Ninguém
   * fica com a cor sozinha (WCAG 1.4.1).
   */
  state: Record<ToolCallState, string>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { RunStatus, TraceSpan } from '@shared/primitives/chat-protocol'
import {
  resolveTraceWaterfall,
  type TraceWaterfallRowDrawing,
} from '@shared/primitives/trace-waterfall-axis'

const props = withDefaults(
  defineProps<{
    /**
     * Os trechos, NA ORDEM EM QUE DEVEM SER OUVIDOS.
     *
     * A posição no eixo é livre; a ordem nesta lista não é, porque ela é a
     * ordem de leitura (WCAG 1.3.2). Sem trecho nenhum não há cascata, e a
     * peça não desenha nada.
     */
    spans: readonly TraceSpan[]
    /**
     * O eixo, em milissegundos. É ele que as barras dividem.
     *
     * Obrigatório e não derivado — ver o docblock do módulo. Eixo sem
     * extensão (zero ou negativo) não posiciona nada, e a peça não desenha
     * nada.
     */
    totalMs: number
    /**
     * Em que pé está a execução que escreve o rastro.
     *
     * Usado para uma pergunta só: ela ainda corre? É ela que decide se a
     * peça se declara ocupada. Receber as cinco palavras e perguntar uma
     * coisa só não é achatamento de dado — um booleano na assinatura
     * obrigaria quem consome a traduzir cinco palavras em duas no ponto da
     * chamada, que é onde a perda aconteceria.
     */
    status?: RunStatus
    labels: TraceWaterfallLabels
  }>(),
  { status: 'idle' },
)

/** Os lugares marcados dos moldes de texto. */
const TOTAL_PLACEHOLDER = '{total}'
const START_PLACEHOLDER = '{start}'
const DURATION_PLACEHOLDER = '{duration}'

/**
 * A cascata pronta para desenhar, ou nada quando não há o que posicionar.
 *
 * SEM TRECHO, OU SEM EIXO, NÃO HÁ CASCATA, e devolver moldura vazia seria
 * pior que devolver nada: a camada que rola é parada de teclado, e uma parada
 * de teclado que leva a uma caixa vazia é ruído com nome.
 */
const drawing = computed(() => resolveTraceWaterfall(props.spans, props.totalMs))

/**
 * As linhas já resolvidas fora do template.
 *
 * O `v-if` da raiz garante que nenhuma delas chega à tela com a cascata
 * ausente; ela existe separada para que o template não dependa de
 * estreitamento de tipo dentro de expressão de atributo, que é onde uma
 * mudança de versão da ferramenta de tipos custa um build.
 */
const drawnRows = computed(() => drawing.value?.rows ?? [])

/** A régua dita em palavras, com o eixo declarado no lugar do molde. */
const axisText = computed(() =>
  props.labels.axis.replace(TOTAL_PLACEHOLDER, String(drawing.value?.totalMs ?? props.totalMs)),
)

/**
 * OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
 * rastro ganha trecho mais depressa do que se lê, e narrar cada trecho é a
 * mesma armadilha do relógio ao vivo. `undefined` remove o atributo, porque
 * `aria-busy="false"` é uma afirmação a mais que ninguém pediu.
 */
const busy = computed(() => (props.status === 'running' ? 'true' : undefined))

/** A duração visível de uma linha, com o número no lugar do molde. */
function durationOf(drawn: TraceWaterfallRowDrawing): string {
  return props.labels.duration.replace(DURATION_PLACEHOLDER, String(drawn.span.durationMs))
}

/**
 * A LEITURA DA LINHA: a palavra do estado, o começo e a duração em números, e
 * o aviso quando o trecho foi recortado.
 *
 * É o que faz a cascata inteira se reconstruir de ouvido: percorrida a
 * lista, cada trecho disse onde está no eixo, e a sobreposição entre dois
 * deles é dedutível dos números.
 */
function readingOf(drawn: TraceWaterfallRowDrawing): string {
  const parts = [
    props.labels.state[drawn.span.state],
    props.labels.reading
      .replace(START_PLACEHOLDER, String(drawn.span.startMs))
      .replace(DURATION_PLACEHOLDER, String(drawn.span.durationMs)),
  ]
  // A barra recortada é uma afirmação a menos: quem vê nota que ela encosta
  // na borda, e quem ouve receberia a duração inteira sem saber disso.
  if (drawn.clipped) parts.push(props.labels.clipped)
  return parts.join(' ')
}
</script>

<template>
  <div
    v-if="drawing"
    class="nds-trace-waterfall"
    data-slot="trace-waterfall"
    :aria-busy="busy"
  >
    <!-- A régua dita em palavras, e ela é visível de propósito (ver folha). -->
    <p
      class="nds-trace-waterfall-axis"
      data-slot="trace-waterfall-axis"
    >{{ axisText }}</p>

    <!-- ── A camada que rola ────────────────────────────────────────
         O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada
         de teclado anônima, e `aria-label` sobre um `div` sem papel é
         DESCARTADO pelo navegador (`aria-prohibited-attr`) — que foi exatamente
         o defeito de duas peças desta casa. `group` e não `region`: uma página
         de documentação tem dezenas destas, e `region` com nome vira dezenas de
         marcos homônimos. -->
    <div
      class="nds-trace-waterfall-viewport"
      data-slot="trace-waterfall-viewport"
      tabindex="0"
      role="group"
      :aria-label="labels.region"
    >
      <!-- `<ol>` e não `<ul>`: a ordem de declaração é a ordem de leitura, e é
           ela que quem monta escolheu. -->
      <ol
        class="nds-trace-waterfall-rows"
        data-slot="trace-waterfall-rows"
      >
        <!-- A CHAVE É A POSIÇÃO, e não o endereço do trecho, pela mesma razão
             do grafo: a ordem de declaração não muda, e nada aqui procura um
             trecho pelo id. -->
        <li
          v-for="(drawn, index) in drawnRows"
          :key="index"
          class="nds-trace-waterfall-row"
          data-slot="trace-waterfall-row"
          :data-state="drawn.span.state"
          :data-span-id="drawn.span.id"
          :style="{ '--trace-waterfall-row-indent': String(drawn.indent) }"
        >
          <span
            class="nds-trace-waterfall-name"
            data-slot="trace-waterfall-name"
          >
            <!-- A MARCA É DECORATIVA e carrega FORMA, não só cor: cheia, anel,
                 anel interrompido, cruz. A palavra do estado está na leitura da
                 linha, para quem não vê nenhuma das quatro. -->
            <span
              class="nds-trace-waterfall-marker"
              data-slot="trace-waterfall-marker"
              aria-hidden="true"
            />
            <span
              class="nds-trace-waterfall-label"
              data-slot="trace-waterfall-label"
            >{{ drawn.span.label }}</span>
          </span>

          <!-- A RÉGUA da linha, fora do que é lido em voz: barra não se lê, e
               o que se lê é a frase logo abaixo, que diz a mesma posição em
               números. -->
          <span
            class="nds-trace-waterfall-track"
            data-slot="trace-waterfall-track"
            aria-hidden="true"
          >
            <span
              class="nds-trace-waterfall-bar"
              data-slot="trace-waterfall-bar"
              :style="{
                '--trace-waterfall-bar-start': String(drawn.start),
                '--trace-waterfall-bar-size': String(drawn.size),
              }"
            />
          </span>

          <span
            class="nds-trace-waterfall-duration"
            data-slot="trace-waterfall-duration"
          >{{ durationOf(drawn) }}</span>

          <span
            class="nds-sr-only"
            data-slot="trace-waterfall-row-reading"
          >{{ readingOf(drawn) }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>
