// Snippet do painel Code do grafo de fluxo — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// OS NÓS E AS LIGAÇÕES ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis
// nós com quatro campos cada ocupariam a tela inteira do painel e não ensinariam
// nada que o contrato já não diga — o que o snippet mostra é a CHAMADA, e o que
// ela precisa: uma lista de nós, uma de ligações e os rótulos.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type FlowGraphSnippetOptions = {
  /** Em que pé está a execução que escreve o grafo. */
  status?: string;
  /** O nome da constante com os nós. */
  nodesRef?: string;
  /** O nome da constante com as ligações. */
  edgesRef?: string;
};

function build(opts: FlowGraphSnippetOptions): string {
  const lines = options([
    ['nodes', opts.nodesRef ?? 'nos'],
    ['edges', opts.edgesRef],
    ['status', text(opts.status ?? 'running')],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('flow-graph', 'createFlowGraph'),
    `const flowGraph = ${callLine('createFlowGraph', lines)};`,
    // Sem nó nenhum não há grafo, e a fábrica devolve nada — o snippet mostra a
    // guarda porque ela é parte do contrato, e não um detalhe de quem escreveu.
    `if (flowGraph) ${appendLine('flowGraph')}`,
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const flowGraphSource: SourceTransform<{
  status: string;
  withEdges: boolean;
  withNodes: boolean;
}> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem nó nenhum a chamada continua existindo, e é o que a story mostra: a
    // guarda é que decide se alguma coisa chega à tela.
    nodesRef: args.withNodes === false ? '[]' : 'nos',
    edgesRef: args.withEdges === false ? undefined : 'arestas',
  });
};

/** Os quatro estados de nó, na mesma grade. */
export function flowGraphEveryStateSnippet(): string {
  return snippet(
    importing('flow-graph', 'createFlowGraph'),
    '// Um nó por estado, na mesma grade: os quatro têm forma própria, e não só',
    '// cor. A palavra de cada um chega a quem não vê a forma.',
    `const flowGraph = ${callLine('createFlowGraph', options([
      ['nodes', 'nos'],
      ['edges', 'arestas'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (flowGraph) ${appendLine('flowGraph')}`,
  );
}

/** Um caminho que quebrou: o estado que a referência não tem. */
export function flowGraphFailureSnippet(): string {
  return build({ status: 'failed', edgesRef: 'arestas' });
}

/** Em andamento, com a execução ocupada. */
export function flowGraphRunningSnippet(): string {
  return build({ status: 'running', edgesRef: 'arestas' });
}

/**
 * O grafo pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de nós, e as
 * ligações que perderam uma ponta somem sozinhas.
 */
export function flowGraphPartialSnippet(): string {
  return snippet(
    importing('flow-graph', 'createFlowGraph'),
    '// REVELAR É PASSAR MENOS NÓS. As ligações que perderam uma ponta somem',
    '// sozinhas, e o grafo pela metade se desenha sem nenhuma regra a mais.',
    `const flowGraph = ${callLine('createFlowGraph', options([
      ['nodes', 'nos.slice(0, 3)'],
      ['edges', 'arestas'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (flowGraph) ${appendLine('flowGraph')}`,
  );
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function flowGraphWideSnippet(): string {
  return build({ status: 'running', nodesRef: 'nosLargos', edgesRef: 'arestasLargas' });
}

/** Rótulos longos, que quebram em vez de cortar. */
export function flowGraphLongLabelsSnippet(): string {
  return build({ status: 'running', nodesRef: 'nosLongos', edgesRef: 'arestasLongas' });
}

/** Um ramo que volta para uma coluna anterior. */
export function flowGraphRejoinSnippet(): string {
  return build({ status: 'running', nodesRef: 'nosDoRetorno', edgesRef: 'arestasDoRetorno' });
}

/**
 * A largura mínima de coluna, na folha de quem consome.
 *
 * É ela que decide quando o grafo passa a ser mais largo que a conversa. Entra
 * como propriedade personalizada, e não como largura em `style`: é a única
 * maneira de mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function flowGraphTightColumnsSnippet(): string {
  return snippet(
    importing('flow-graph', 'createFlowGraph'),
    `const flowGraph = ${callLine('createFlowGraph', options([
      ['nodes', 'nos'],
      ['edges', 'arestas'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    [
      '/* A largura MÍNIMA de coluna, na folha de quem consome. */',
      '.nds-flow-graph {',
      '  --flow-graph-column-min: var(--spacing-16);',
      '}',
    ].join('\n'),
    `if (flowGraph) ${appendLine('flowGraph')}`,
  );
}
