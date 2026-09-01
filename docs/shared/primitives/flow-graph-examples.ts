/**
 * O grafo de exemplo das demonstrações, compartilhado pelas cinco stacks.
 *
 * Por que compartilhado, e não escrito em cada stack: `chat-examples.ts` já
 * estabeleceu o motivo, e num grafo ele pesa mais que nas irmãs. A forma do
 * grafo É a foto — cinco stacks escrevendo as próprias coordenadas mostrariam
 * cinco desenhos diferentes, e a divergência só apareceria no Chromatic, como
 * diferença de layout que ninguém consegue atribuir a nada.
 *
 * SEM I18N, como manda a §3.3 da guideline 17: o que se traduz são os RÓTULOS
 * DA INTERFACE — o nome da região, a palavra de cada estado, o molde da
 * dependência —, e esses moram na `translations.json`. O que está aqui é a
 * fala do exemplo.
 *
 * O grafo escolhido RAMIFICA E REENCONTRA de propósito. É o que a fonte declara
 * como o assunto da peça, e é o que uma fila ordenada não sabe descrever: da
 * leitura do pedido saem dois caminhos que correm em paralelo, e os dois voltam
 * a se juntar na resposta. Um grafo em linha reta seria um plano com
 * coordenadas, e não provaria nada.
 */

import type { FlowEdge, FlowNode } from './chat-protocol';

/**
 * Um atendimento que se abre em dois caminhos e volta a se juntar.
 *
 * As colunas contam a partir de zero e as linhas também, mas isso é
 * indiferente: as coordenadas de `FlowNode` são relativas entre si, e quem
 * desenha desloca o grafo inteiro para a origem.
 */
export const FLOW_NODES_ORDER: readonly FlowNode[] = [
  { id: 'pedido', label: 'Ler o pedido', column: 0, row: 1, state: 'done' },
  { id: 'catalogo', label: 'Buscar no catálogo', column: 1, row: 0, state: 'done' },
  { id: 'estoque', label: 'Conferir o estoque', column: 1, row: 2, state: 'done' },
  { id: 'preco', label: 'Comparar preços', column: 2, row: 0, state: 'running' },
  { id: 'entrega', label: 'Calcular a entrega', column: 2, row: 2, state: 'pending' },
  { id: 'resposta', label: 'Escrever a resposta', column: 3, row: 1, state: 'pending' },
];

/**
 * As dependências do mesmo atendimento.
 *
 * Seis arestas para seis nós: duas saem do primeiro, duas chegam ao último, e
 * é esse par que uma fila não consegue escrever.
 */
export const FLOW_EDGES_ORDER: readonly FlowEdge[] = [
  { from: 'pedido', to: 'catalogo' },
  { from: 'pedido', to: 'estoque' },
  { from: 'catalogo', to: 'preco' },
  { from: 'estoque', to: 'entrega' },
  { from: 'preco', to: 'resposta' },
  { from: 'entrega', to: 'resposta' },
];

/**
 * O mesmo atendimento com um caminho quebrado.
 *
 * Existe porque `failed` é o estado que a fonte do catálogo não tem: lá um nó
 * que quebrou desenha igual a um que terminou. A demonstração precisa mostrar
 * os quatro estados na mesma grade para que a diferença apareça.
 */
export const FLOW_NODES_FAILURE: readonly FlowNode[] = [
  { id: 'pedido', label: 'Ler o pedido', column: 0, row: 1, state: 'done' },
  { id: 'catalogo', label: 'Buscar no catálogo', column: 1, row: 0, state: 'done' },
  { id: 'estoque', label: 'Conferir o estoque', column: 1, row: 2, state: 'failed' },
  { id: 'preco', label: 'Comparar preços', column: 2, row: 0, state: 'running' },
  { id: 'entrega', label: 'Calcular a entrega', column: 2, row: 2, state: 'pending' },
  { id: 'resposta', label: 'Escrever a resposta', column: 3, row: 1, state: 'pending' },
];

/**
 * O começo do mesmo atendimento, com três nós em vez de seis.
 *
 * É a REVELAÇÃO feita como esta família a faz: quem quer mostrar o grafo aos
 * poucos passa MENOS nós, e as arestas que perderam uma ponta somem sozinhas
 * (regra 5 da leitura da família 4). Não existe contador de revelação na peça,
 * e é este exemplo que mostra por que não é preciso.
 */
export const FLOW_NODES_PARTIAL: readonly FlowNode[] = FLOW_NODES_ORDER.slice(0, 3);
