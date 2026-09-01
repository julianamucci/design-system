/**
 * A conta da cascata de trechos: onde cada barra começa no eixo comum, quanto
 * dela cabe ali e quanto recuo o trecho carrega.
 *
 * Sem framework, sem DOM. É a mesma divisão de `chat-scroll.ts`, de
 * `token-budget.ts` e de `flow-graph-edges.ts`: `chat-protocol.ts` é o
 * VOCABULÁRIO — `TraceSpan` —, e este módulo é a CONTA que cinco stacks fariam
 * de cinco maneiras.
 *
 * POR QUE É PRIMITIVO, e não duas divisões dentro de cada componente. Cinco
 * decisões, e nenhuma delas é óbvia o bastante para sobreviver a cinco
 * transcrições:
 *
 *   · O EIXO É UM SÓ, E ELE CHEGA DE FORA. `totalMs` não é derivado dos trechos.
 *     Derivá-lo faria a régua encolher quando quem monta mostrasse só os últimos
 *     trechos, e as barras restantes reescalariam em vez de guardar a posição
 *     verdadeira — que é exatamente o contrário do que uma cascata serve para
 *     mostrar. Sem eixo (total zero ou negativo) não há posição, e a conta
 *     devolve nada.
 *   · A NORMALIZAÇÃO DO RECUO. `depth` é relativo entre os trechos, como
 *     `column` e `row` são no grafo: é aqui que o menor recuo encosta no zero.
 *     Cinco stacks decidindo sozinhas o que fazer com um recuo 3 sem recuo 0
 *     dariam cinco cascatas diferentes — uma com três degraus vazios à esquerda,
 *     outra sem nenhum.
 *   · O RECORTE NO EIXO. Um trecho que começa antes da origem ou termina depois
 *     do total não é erro: é o eixo declarado menor que o rastro, e é o caso de
 *     quem mostra uma JANELA do tempo. A barra é recortada para caber, e uma
 *     stack que não recortasse desenharia por cima do vizinho.
 *   · A BARRA MÍNIMA. Um trecho de zero milissegundo continua sendo um trecho, e
 *     uma barra de largura zero diria "não houve" — que não é o que o dado diz.
 *     Ela desenha com a menor largura visível, e é o único lugar onde a conta
 *     mente sobre a duração: mentir de menos aqui é perder o trecho da tela.
 *   · A ORDEM NÃO SE MEXE. Os trechos saem na ordem em que foram declarados, e
 *     não ordenados por começo. A ordem no DOM é a ordem de leitura (WCAG
 *     1.3.2), e ordenar seria a peça reescrevendo o rastro de quem monta — a
 *     mesma coisa que a §2 da guideline 17 recusa quando recusa algoritmo de
 *     disposição.
 *
 * A UNIDADE DE SAÍDA É A PORCENTAGEM DO EIXO, e não o pixel. Quem estica isso
 * até o tamanho da tela é a folha, com `calc(var(--trace-waterfall-bar-start) *
 * 1%)` — a mesma decisão de `--computer-use-mark-x`. É o que permite a conta ser
 * feita uma vez, sem medir elemento nenhum: nada aqui lê `getBoundingClientRect`,
 * e por isso nada aqui precisa de navegador para ser testado.
 *
 * O QUE NÃO MORA AQUI: formatação. Este módulo não escreve "1.200 ms" nem
 * escolhe unidade — número é dado, e a frase que o apresenta é do idioma, em
 * `translations.json`.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT) — o desenho e os estados.
 */

import type { TraceSpan } from './chat-protocol';

/**
 * A menor largura de barra que ainda se vê, em porcentagem do eixo.
 *
 * Meio por cento, e o número tem motivo: num eixo de 800 px isso é 4 px, que é
 * o menor traço que sobrevive a um arredondamento de renderização. Abaixo disso
 * a barra existe no DOM e não existe na tela, que é o pior dos dois mundos —
 * quem vê não encontra o trecho, e quem ouve encontra.
 *
 * Não é opção de quem consome: é desenho, e quem quisesse outro estaria pedindo
 * outra cascata.
 */
const MIN_BAR = 0.5;

/** Três casas decimais bastam para uma porcentagem, e o estilo fica legível. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Um trecho já posicionado no eixo comum, com o recuo encostado na origem. */
export interface TraceWaterfallRowDrawing {
  /** O trecho como quem monta o declarou. */
  span: TraceSpan;
  /**
   * O recuo em degraus, contado a partir de ZERO.
   *
   * Zero e não um, ao contrário da linha de grade do grafo: aqui o número entra
   * numa multiplicação da folha (`calc(var(--indent) * var(--spacing-4))`), e um
   * degrau começando em um daria recuo a quem não tem pai.
   */
  indent: number;
  /**
   * A distância da borda de início do eixo, em porcentagem dele.
   *
   * Já recortada em zero: um trecho que começa antes da origem do eixo começa
   * na origem, e o que ele perdeu sai da largura.
   */
  start: number;
  /**
   * A largura da barra, em porcentagem do eixo.
   *
   * Já recortada no fim — `start + size` nunca passa de cem — e nunca menor que
   * a barra mínima.
   */
  size: number;
  /**
   * O trecho não coube inteiro no eixo declarado?
   *
   * É informação de DESENHO e de LEITURA ao mesmo tempo: a barra recortada
   * merece uma ponta diferente para quem vê, e quem monta pode querer dizer em
   * palavras que aquele trecho continua fora da janela.
   */
  clipped: boolean;
}

/** A cascata pronta para desenhar: o eixo e as linhas. */
export interface TraceWaterfallDrawing {
  /** O eixo, como quem monta o declarou. É ele que as barras dividem. */
  totalMs: number;
  /** O maior recuo depois de encostar na origem. Zero quando ninguém recua. */
  depth: number;
  rows: readonly TraceWaterfallRowDrawing[];
}

/**
 * A cascata pronta para desenhar, ou `null` quando não há o que posicionar.
 *
 * `null` em dois casos, e os dois pela mesma razão: sem trecho não há fila, e
 * sem eixo com extensão não há posição. Devolver moldura vazia seria pior que
 * devolver nada — a camada que rola é parada de teclado, e uma parada de teclado
 * que leva a uma caixa vazia é ruído com nome.
 *
 * DURAÇÃO NEGATIVA vira zero, e a barra mínima cuida do resto. Duração negativa
 * é dado ruim, e as duas saídas ruins seriam sumir com a linha — reescrever o
 * rastro de quem monta — ou desenhar uma barra que anda para trás, que é uma
 * afirmação sobre o tempo que o dado não faz.
 */
export function resolveTraceWaterfall(
  spans: readonly TraceSpan[],
  totalMs: number,
): TraceWaterfallDrawing | null {
  if (spans.length === 0) return null;
  if (!(totalMs > 0)) return null;

  let minDepth = Infinity;
  for (const span of spans) {
    if (span.depth < minDepth) minDepth = span.depth;
  }

  let maxIndent = 0;
  const rows: TraceWaterfallRowDrawing[] = spans.map((span) => {
    // O RECUO VIRA DEGRAU INTEIRO. Meio degrau descreveria um nível que não
    // existe, e `Math.round` o encosta no vizinho em vez de abrir meia calha
    // que nenhum outro trecho ocupa. Nunca negativo: o menor encosta no zero.
    const indent = Math.max(0, Math.round(span.depth - minDepth));
    if (indent > maxIndent) maxIndent = indent;

    const duration = Math.max(0, span.durationMs);
    const from = Math.max(0, span.startMs);
    const to = Math.min(totalMs, span.startMs + duration);

    // O COMEÇO PARA UMA BARRA MÍNIMA ANTES DO FIM DO EIXO, e não em cem. Um
    // trecho que começa depois do total declarado — janela mostrando o meio de
    // um rastro longo — encostaria na borda e sairia com largura zero, e a
    // barra mínima deixaria de valer justamente onde ela é mais necessária.
    const start = Math.min(100 - MIN_BAR, Math.max(0, (from / totalMs) * 100));
    // A largura sai do que SOBROU dentro do eixo, e não da duração declarada:
    // é o que faz o recorte acontecer nas duas pontas com uma conta só.
    const visible = Math.max(0, to - from);
    const size = Math.min(100 - start, Math.max(MIN_BAR, (visible / totalMs) * 100));

    return {
      span,
      indent,
      start: round(start),
      size: round(size),
      clipped: span.startMs < 0 || span.startMs + duration > totalMs,
    };
  });

  return { totalMs, depth: maxIndent, rows };
}
