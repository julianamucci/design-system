/**
 * A conta do grafo de fluxo: onde cada nó cai na grade, que arestas dá para
 * desenhar e por onde a curva de cada uma passa.
 *
 * Sem framework, sem DOM. É a mesma divisão de `chat-scroll.ts` e de
 * `token-budget.ts`: `chat-protocol.ts` é o VOCABULÁRIO — `FlowNode`,
 * `FlowEdge` —, e este módulo é a CONTA que cinco stacks fariam de cinco
 * maneiras.
 *
 * POR QUE É PRIMITIVO, e não um punhado de linhas dentro de cada componente.
 * Três decisões, e nenhuma delas é óbvia o bastante para sobreviver a cinco
 * transcrições:
 *
 *   · A NORMALIZAÇÃO. As coordenadas de `FlowNode` são relativas entre si (ver
 *     o docblock lá), e é aqui que o grafo inteiro desliza para que a menor
 *     coluna e a menor linha caiam na origem. Cinco stacks decidindo sozinhas o
 *     que fazer com uma coluna 3 sem coluna 0 dariam cinco grades diferentes —
 *     uma com três colunas vazias à esquerda, outra sem nenhuma.
 *   · A ARESTA ÓRFÃ. Uma aresta que aponta para um nó que não veio não tem duas
 *     pontas, e ponta que falta não é erro: é o grafo mostrado pela metade, que
 *     é como se revela um fluxo aos poucos (§2 e a regra 5 da 5.3 da guideline
 *     17 — quem quer revelar passa MENOS nós). Ela some, e some do desenho e da
 *     leitura ao mesmo tempo. Sem esta regra num lugar só, uma stack desenharia
 *     curva para o nada e outra quebraria.
 *   · A CURVA. Cinco stacks escrevendo o próprio Bézier é cinco desenhos
 *     diferentes para o mesmo grafo — a mesma razão pela qual `ComputerStep`
 *     mora no compartilhado, e o mesmo defeito: geometria que discorda não
 *     aparece em teste, aparece como foto torta.
 *
 * A UNIDADE É A CASA DA GRADE, e não o pixel. O caminho sai em coordenadas de
 * célula — o centro da casa `(c, r)` é `(c + 0,5; r + 0,5)` —, e quem estica
 * isso até o tamanho da tela é o `viewBox` do `<svg>`, na folha. É o que
 * permite a conta ser feita uma vez, sem medir elemento nenhum: nada aqui lê
 * `getBoundingClientRect`, e por isso nada aqui precisa de navegador para ser
 * testado.
 *
 * O QUE NÃO MORA AQUI: disposição. Este módulo não escolhe coluna nem linha de
 * ninguém — quem monta o grafo é quem sabe a forma dele. Um algoritmo de
 * disposição envelheceria por produto, e é o que a §2 da guideline 17 recusa.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT) — o desenho e os estados.
 */

import type { FlowEdge, FlowNode } from './chat-protocol';

/**
 * O quanto a curva se abre antes de chegar ao destino, em casas da grade.
 *
 * Meia casa, e o número tem motivo: com abertura proporcional à distância, uma
 * aresta entre nós da MESMA coluna — que existe, e é o ramo que desce sem
 * avançar — teria abertura zero e viraria um segmento de reta vertical
 * atravessando a caixa dos nós entre as duas pontas. Com um mínimo, ela desvia.
 *
 * Não é opção de quem consome: é desenho, e quem quisesse outro estaria
 * pedindo outro grafo.
 */
const MIN_BOW = 0.5;

/** Três casas decimais bastam para uma grade, e o caminho fica legível. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Um nó já deslocado para a origem, com a casa que ele ocupa na grade. */
export interface FlowGraphNodeDrawing {
  /** O nó como quem monta o declarou. */
  node: FlowNode;
  /**
   * A linha de grade da coluna, contada a partir de UM.
   *
   * Linha de grade, e não índice: é o número que `grid-column-start` recebe. A
   * conversão mora aqui porque `calc()` dentro de número de linha de grade não
   * é suportado de forma confiável, então a folha lê a propriedade
   * personalizada como ela chega — e uma conversão feita na folha de uma stack
   * e no código de outra é como duas verdades divergem.
   */
  columnLine: number;
  /** A linha de grade da linha, contada a partir de um. */
  rowLine: number;
  /**
   * Os rótulos dos nós de que este depende, na ordem em que as arestas foram
   * declaradas.
   *
   * É a LEITURA do grafo, e é o que chega a quem não vê a curva. Só as arestas
   * que CHEGAM: cada aresta aparece exatamente uma vez desta maneira, e listar
   * também as que saem anunciaria cada ligação duas vezes sem acrescentar
   * relação nenhuma.
   */
  dependsOn: readonly string[];
}

/** Uma aresta que tem as duas pontas, e o caminho por onde ela passa. */
export interface FlowGraphEdgeDrawing {
  from: string;
  to: string;
  /** O atributo `d` do caminho, em coordenadas de casa da grade. */
  path: string;
}

/** O grafo pronto para desenhar: o tamanho da grade, os nós e as arestas. */
export interface FlowGraphDrawing {
  /** Quantas casas a grade tem na horizontal. */
  columns: number;
  /** Quantas casas a grade tem na vertical. */
  rows: number;
  nodes: readonly FlowGraphNodeDrawing[];
  edges: readonly FlowGraphEdgeDrawing[];
}

/**
 * O caminho de uma aresta, do centro de uma casa ao centro da outra.
 *
 * Cúbica com os dois pontos de controle na HORIZONTAL: a curva sai do nó de
 * origem para o lado e chega ao de destino pelo lado, que é o que faz um ramo
 * que desce parecer um ramo, e não um risco na diagonal. A abertura acompanha a
 * distância entre as colunas, com o mínimo de `MIN_BOW`.
 *
 * A aresta que VOLTA — destino à esquerda da origem, que é o reencontro de um
 * ramo — sai para a direita e chega pela esquerda mesmo assim, e o laço que
 * isso desenha é a informação: ela mostra que o fluxo voltou.
 */
function edgePath(from: FlowGraphNodeDrawing, to: FlowGraphNodeDrawing): string {
  const x1 = from.columnLine - 0.5;
  const y1 = from.rowLine - 0.5;
  const x2 = to.columnLine - 0.5;
  const y2 = to.rowLine - 0.5;
  const bow = Math.max(Math.abs(x2 - x1) / 2, MIN_BOW);

  return [
    `M ${round(x1)} ${round(y1)}`,
    `C ${round(x1 + bow)} ${round(y1)}`,
    `${round(x2 - bow)} ${round(y2)}`,
    `${round(x2)} ${round(y2)}`,
  ].join(' ');
}

/**
 * O grafo pronto para desenhar, ou `null` quando não há nó nenhum.
 *
 * `null` e não um grafo vazio: sem nó não existe grade, não existe `viewBox` e
 * não existe região para nomear — e uma moldura vazia com nome de região é uma
 * parada de teclado que não leva a lugar nenhum. Quem desenha devolve nada.
 *
 * ID REPETIDO: a PRIMEIRA declaração vence, e as duas caixas continuam
 * desenhadas. Endereço repetido é dado ruim, e as duas saídas ruins seriam
 * sumir com uma caixa — reescrever o grafo de quem monta — ou ligar a aresta a
 * um nó qualquer dos dois. Vencer o primeiro pelo menos é previsível: é o que
 * quem lê o dado de cima para baixo encontra primeiro.
 *
 * ARESTA DE UM NÓ PARA ELE MESMO: sai. Ela não é relação — uma dependência de
 * si mesmo não diz nada sobre a ordem —, e a curva dela seria um ponto.
 */
export function resolveFlowGraph(
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[] = [],
): FlowGraphDrawing | null {
  if (nodes.length === 0) return null;

  let minColumn = Infinity;
  let minRow = Infinity;
  let maxColumn = -Infinity;
  let maxRow = -Infinity;
  for (const node of nodes) {
    if (node.column < minColumn) minColumn = node.column;
    if (node.row < minRow) minRow = node.row;
    if (node.column > maxColumn) maxColumn = node.column;
    if (node.row > maxRow) maxRow = node.row;
  }

  // A COORDENADA VIRA CASA INTEIRA. Quem monta declara a casa da grade, e um
  // meio-número descreveria uma casa que não existe: `Math.round` o encosta na
  // vizinha em vez de abrir meia coluna que nenhum outro nó ocupa.
  const drawings: FlowGraphNodeDrawing[] = nodes.map((node) => ({
    node,
    columnLine: Math.round(node.column - minColumn) + 1,
    rowLine: Math.round(node.row - minRow) + 1,
    dependsOn: [],
  }));

  const byId = new Map<string, FlowGraphNodeDrawing>();
  for (const drawing of drawings) {
    if (!byId.has(drawing.node.id)) byId.set(drawing.node.id, drawing);
  }

  const dependsOn = new Map<string, string[]>();
  const drawn: FlowGraphEdgeDrawing[] = [];
  for (const edge of edges) {
    if (edge.from === edge.to) continue;
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    // PONTA QUE FALTA NÃO É ERRO: é o grafo mostrado pela metade.
    if (!from || !to) continue;

    drawn.push({ from: edge.from, to: edge.to, path: edgePath(from, to) });

    const already = dependsOn.get(edge.to);
    if (already) already.push(from.node.label);
    else dependsOn.set(edge.to, [from.node.label]);
  }

  for (const drawing of drawings) {
    drawing.dependsOn = dependsOn.get(drawing.node.id) ?? [];
  }

  return {
    columns: Math.round(maxColumn - minColumn) + 1,
    rows: Math.round(maxRow - minRow) + 1,
    nodes: drawings,
    edges: drawn,
  };
}
