/**
 * Transforms do painel Code do grafo de fluxo.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * fora do navegador — a saída do painel não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet. O sufixo `Source`/`Snippet` fica no FIM do nome de
 * propósito: a guarda que varre os construtores de snippet procura por ele ali,
 * e nome fora do padrão sai da varredura em silêncio.
 *
 * OS NÓS E AS LIGAÇÕES ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis
 * nós com quatro campos cada ocupariam a tela inteira do painel e não
 * ensinariam nada que o contrato já não diga — o que o snippet mostra é a
 * CHAMADA, e o que ela precisa: uma lista de nós, uma de ligações e os rótulos.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type FlowGraphSnippetOptions = {
  /** Em que pé está a execução que escreve o grafo. */
  status?: string;
  /** O nome da constante com os nós. */
  nodesRef?: string;
  /** O nome da constante com as ligações. Ausente é "não houve ligação". */
  edgesRef?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = {
  args?: { status?: string; revealed?: number; withEdges?: boolean };
};

const IMPORT = "import { FlowGraph } from '@/components/ui/flow-graph';";

/** O uso real: os nós, as ligações, o estado da execução e os rótulos. */
function build(opts: FlowGraphSnippetOptions): string {
  const attributes = attrsMultilinha([
    `nodes={${opts.nodesRef ?? 'nos'}}`,
    opts.edgesRef ? `edges={${opts.edgesRef}}` : false,
    `status="${opts.status ?? 'running'}"`,
    'labels={rotulos}',
  ]);

  return svelteSnippet(IMPORT, `<FlowGraph${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export function flowGraphSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem nó nenhum a marcação continua existindo, e é o que a story mostra: a
    // peça é que decide não desenhar.
    nodesRef: args.revealed === 0 ? '[]' : 'nos',
    edgesRef: args.withEdges === false ? undefined : 'arestas',
  });
}

/** Os quatro estados de nó, na mesma grade. */
export function flowGraphEveryStateSnippet(): string {
  const attributes = attrsMultilinha([
    'nodes={nos}',
    'edges={arestas}',
    'status="running"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  Um nó por estado, na mesma grade: os quatro têm forma própria, e não só',
    '  cor. A palavra de cada um chega a quem não vê a forma.',
    '-->',
    `<FlowGraph${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
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
  const attributes = attrsMultilinha([
    'nodes={nos.slice(0, 3)}',
    'edges={arestas}',
    'status="running"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  REVELAR É PASSAR MENOS NÓS. As ligações que perderam uma ponta somem',
    '  sozinhas, e o grafo pela metade se desenha sem nenhuma regra a mais.',
    '-->',
    `<FlowGraph${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
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
 * como propriedade personalizada num bloco de estilo, e não como largura em
 * `style` inline: é a única maneira de mudá-la sem tirar o valor do tema e da
 * escala de tipo. O `:global` é necessário porque a classe é da folha
 * compartilhada, e a especificidade tem de vencer a declaração que a própria
 * folha faz no elemento.
 */
export function flowGraphTightColumnsSnippet(): string {
  // Os atributos são escritos À MÃO aqui, e só aqui: a peça está aninhada num
  // invólucro, e o recuo de `attrsMultilinha` é o do nível de cima. Recuo
  // errado no painel ensina marcação torta a quem copia.
  const markup = [
    '<div data-apertado>',
    '  <FlowGraph',
    '    nodes={nos}',
    '    edges={arestas}',
    '    status="running"',
    '    labels={rotulos}',
    '  />',
    '</div>',
    '',
    '<style>',
    '  /* A largura MÍNIMA de coluna, na folha de quem consome. */',
    '  [data-apertado] :global(.nds-flow-graph) {',
    '    --flow-graph-column-min: var(--spacing-16);',
    '  }',
    '</style>',
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}
