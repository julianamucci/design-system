/**
 * O rastro de exemplo das demonstrações, compartilhado pelas cinco stacks.
 *
 * Por que compartilhado, e não escrito em cada stack: `chat-examples.ts` já
 * estabeleceu o motivo, e num eixo de tempo ele pesa tanto quanto no grafo. A
 * posição das barras É a foto — cinco stacks escrevendo os próprios
 * milissegundos mostrariam cinco cascatas diferentes, e a divergência só
 * apareceria no Chromatic, como diferença de layout que ninguém consegue
 * atribuir a nada.
 *
 * SEM I18N, como manda a §3.3 da guideline 17: o que se traduz são os RÓTULOS
 * DA INTERFACE — o nome da camada que rola, a frase do eixo, a palavra de cada
 * estado —, e esses moram na `translations.json`. O que está aqui é a fala do
 * exemplo.
 *
 * O RASTRO ESCOLHIDO SE SOBREPÕE E ANINHA de propósito. É o que a fonte declara
 * como o assunto da peça, e é o que uma fila de barras ancoradas no zero não
 * sabe descrever: dois trechos correm ao mesmo tempo dentro de um terceiro, e
 * só a POSIÇÃO no eixo mostra que eles se sobrepõem. Um rastro em que cada
 * trecho começa quando o anterior termina seria uma lista de durações, e não
 * provaria nada.
 */

import type { TraceSpan } from './chat-protocol';

/**
 * O eixo do rastro de exemplo, em milissegundos.
 *
 * Ele é DADO e não derivado: é ele que faz as barras dividirem uma régua só, e
 * é ele que continua valendo quando a demonstração mostra apenas os primeiros
 * trechos — sem isso as barras restantes reescalariam e perderiam a posição
 * verdadeira no eixo.
 */
export const TRACE_TOTAL_MS = 1200;

/**
 * Um atendimento repartido em trechos que se aninham e se sobrepõem.
 *
 * Os recuos contam a partir de zero, mas isso é indiferente: `depth` é relativo
 * entre os trechos, e quem desenha encosta o menor na origem.
 */
export const TRACE_SPANS_ORDER: readonly TraceSpan[] = [
  { id: 'pedido', label: 'Atender o pedido', startMs: 0, durationMs: 1180, depth: 0, state: 'done' },
  { id: 'sessao', label: 'Abrir a sessão', startMs: 20, durationMs: 70, depth: 1, state: 'done' },
  { id: 'catalogo', label: 'Consultar o catálogo', startMs: 110, durationMs: 320, depth: 1, state: 'done' },
  { id: 'estoque', label: 'Conferir o estoque', startMs: 150, durationMs: 230, depth: 2, state: 'done' },
  { id: 'frete', label: 'Calcular o frete', startMs: 440, durationMs: 260, depth: 1, state: 'running' },
  { id: 'resposta', label: 'Escrever a resposta', startMs: 710, durationMs: 470, depth: 1, state: 'pending' },
];

/**
 * O mesmo atendimento com um trecho quebrado.
 *
 * Existe porque `failed` é um dos quatro estados e o rastro em ordem só mostra
 * três. A demonstração precisa dos quatro na mesma régua para que a diferença
 * de forma apareça — a marca cheia, o anel, o anel interrompido e a cruz.
 */
export const TRACE_SPANS_FAILURE: readonly TraceSpan[] = [
  { id: 'pedido', label: 'Atender o pedido', startMs: 0, durationMs: 1180, depth: 0, state: 'failed' },
  { id: 'sessao', label: 'Abrir a sessão', startMs: 20, durationMs: 70, depth: 1, state: 'done' },
  { id: 'catalogo', label: 'Consultar o catálogo', startMs: 110, durationMs: 320, depth: 1, state: 'done' },
  { id: 'estoque', label: 'Conferir o estoque', startMs: 150, durationMs: 230, depth: 2, state: 'failed' },
  { id: 'frete', label: 'Calcular o frete', startMs: 440, durationMs: 260, depth: 1, state: 'running' },
  { id: 'resposta', label: 'Escrever a resposta', startMs: 710, durationMs: 470, depth: 1, state: 'pending' },
];

/**
 * O começo do mesmo atendimento, com três trechos em vez de seis.
 *
 * É a REVELAÇÃO feita como esta família a faz: quem quer mostrar o rastro aos
 * poucos passa MENOS trechos, e o eixo continua sendo o mesmo (regra 6 da
 * folha). É justamente por isso que o total não é derivado — derivado, ele
 * encolheria aqui, e as três barras que sobraram reescalariam para ocupar a
 * régua inteira em vez de guardar a posição verdadeira.
 */
export const TRACE_SPANS_PARTIAL: readonly TraceSpan[] = TRACE_SPANS_ORDER.slice(0, 3);
