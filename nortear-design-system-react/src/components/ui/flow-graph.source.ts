/**
 * Snippet do painel Code do grafo de fluxo — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * fora do navegador, a única guarda que elas têm: a saída do painel não chega
 * ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e com o
 * sufixo `Source` no FIM do nome. Fábrica curried devolveria função em vez de
 * string, e as checagens que leem o snippet nunca chegariam ao snippet.
 *
 * OS NÓS E AS LIGAÇÕES ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis
 * nós com quatro campos cada ocupariam a tela inteira do painel e não
 * ensinariam nada que o contrato já não diga — o que o snippet mostra é a
 * CHAMADA, e o que ela precisa: uma lista de nós, uma de ligações e os rótulos.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';
import { FLOW_NODES_ORDER } from '@shared/primitives/flow-graph-examples';

const IMPORT = 'import { FlowGraph } from "@/components/ui/flow-graph";';

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: o `Record` dos estados é completo por contrato — os quatro
 * têm forma própria, e a palavra de cada um é o que chega a quem não vê a forma
 * —, e um objeto pela metade não compila para quem copia.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  region: "Fluxo do atendimento",',
  '  dependsOn: "Depende de {sources}.",',
  '  state: {',
  '    pending: "Por fazer",',
  '    running: "Em andamento",',
  '    done: "Concluído",',
  '    failed: "Falhou",',
  '  },',
  '};',
].join('\n');

/** O identificador na raiz de uma expressão, ou nada quando ela é literal. */
function rootName(expression: string): string | undefined {
  const raiz = /^([A-Za-z_$][\w$]*)/.exec(expression);
  return raiz?.[1];
}

/**
 * Os nós, com o nome que AQUELE ramo usa.
 *
 * A LISTA ENTRA RESUMIDA, e é a única elisão: seis nós com cinco campos cada
 * ocupariam a tela inteira do painel e afogariam a chamada que o snippet existe
 * para ensinar. Resumida, porém, e não ELIDIDA — a versão anterior citava `nos`
 * sem nunca declará-lo, e quem copiava recebia um símbolo indefinido.
 */
function nodesBlock(name: string): string {
  return [
    '// Um item por passo do fluxo — aqui, os quatro primeiros.',
    `const ${name} = [`,
    '  { id: "pedido", label: "Ler o pedido", column: 0, row: 1, state: "done" },',
    '  { id: "catalogo", label: "Buscar no catálogo", column: 1, row: 0, state: "done" },',
    '  { id: "estoque", label: "Conferir o estoque", column: 1, row: 2, state: "done" },',
    '  { id: "preco", label: "Comparar preços", column: 2, row: 0, state: "running" },',
    '];',
  ].join('\n');
}

/** As ligações, com o nome que AQUELE ramo usa. Resumidas pelo mesmo motivo. */
function edgesBlock(name: string): string {
  return [
    '// Uma por dependência, entre os nós acima — aqui, as três primeiras.',
    `const ${name} = [`,
    '  { from: "pedido", to: "catalogo" },',
    '  { from: "pedido", to: "estoque" },',
    '  { from: "catalogo", to: "preco" },',
    '];',
  ].join('\n');
}

/**
 * O preâmbulo do snippet: o import, os nós, as ligações e os rótulos.
 *
 * Cada ramo passa os SEUS nomes, como o modelo da grade de atividade faz: um
 * ramo que desenha `nosLargos` declara `nosLargos`, e não um `nos` que ele não
 * usa. Expressão literal (`[]`) não tem constante a declarar.
 */
function preamble(nodesRef = 'nos', edgesRef?: string): string {
  const nodes = rootName(nodesRef);
  const edges = edgesRef === undefined ? undefined : rootName(edgesRef);
  return [
    IMPORT,
    '',
    ...(nodes ? [nodesBlock(nodes), ''] : []),
    ...(edges ? [edgesBlock(edges), ''] : []),
    LABELS_BLOCK,
  ].join('\n');
}

export type FlowGraphSnippetOptions = {
  /** Em que pé está a execução que escreve o grafo. */
  status?: string;
  /** A expressão que produz os nós. */
  nodesRef?: string;
  /** O nome da constante com as ligações. */
  edgesRef?: string;
};

/** A tag, sempre com um atributo por linha. */
function tag(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<FlowGraph\n${list.map((part) => indentar(part)).join('\n')}\n/>`;
}

function build(opts: FlowGraphSnippetOptions): string {
  return jsxSnippet(
    preamble(opts.nodesRef ?? 'nos', opts.edgesRef),
    tag([
      `nodes={${opts.nodesRef ?? 'nos'}}`,
      // Sem ligação nenhuma sobram as caixas nas casas em que foram postas, e o
      // snippet acompanha: uma lista vazia escrita por extenso ensinaria a
      // passar o que não existe.
      opts.edgesRef === undefined ? undefined : `edges={${opts.edgesRef}}`,
      `status="${opts.status ?? 'running'}"`,
      'labels={rotulos}',
    ]),
  );
}

/**
 * A expressão dos nós, a partir de quantos a story revelou.
 *
 * REVELAR É PASSAR MENOS NÓS, e é isso que o snippet precisa ensinar: nenhum
 * contador vive dentro da peça. Sem número nenhum — que é como a guarda
 * transversal chama estas funções — o grafo é o inteiro.
 */
function nodesExpression(revealed: unknown, total: number): string {
  if (typeof revealed !== 'number' || !Number.isFinite(revealed)) return 'nos';
  if (revealed <= 0) return '[]';
  if (revealed >= total) return 'nos';
  return `nos.slice(0, ${revealed})`;
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const flowGraphSource: SourceTransform<{
  status: string;
  revealed: number;
  withEdges: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: text(args.status),
    // O tamanho do grafo de exemplo sai do próprio exemplo: ele só serve para
    // decidir quando a fatia deixa de ser fatia e volta a ser a lista inteira.
    nodesRef: nodesExpression(args.revealed, FLOW_NODES_ORDER.length),
    edgesRef: args.withEdges === false ? undefined : 'arestas',
  });
};

/** Os quatro estados de nó, na mesma grade. */
export function flowGraphEveryStateSource(): string {
  return jsxSnippet(
    preamble('nos', 'arestas'),
    [
      '// Um nó por estado, na mesma grade: os quatro têm forma própria, e não',
      '// só cor. A palavra de cada um chega a quem não vê a forma.',
      tag([
        'nodes={nos}',
        'edges={arestas}',
        'status="complete"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/** Um caminho que quebrou: o estado que a referência não tem. */
export function flowGraphFailureSource(): string {
  return build({ status: 'failed', edgesRef: 'arestas' });
}

/** Em andamento, com a execução ocupada. */
export function flowGraphRunningSource(): string {
  return build({ status: 'running', edgesRef: 'arestas' });
}

/**
 * O grafo pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de nós, e as
 * ligações que perderam uma ponta somem sozinhas.
 */
export function flowGraphPartialSource(): string {
  return jsxSnippet(
    preamble('nos', 'arestas'),
    [
      '// REVELAR É PASSAR MENOS NÓS. As ligações que perderam uma ponta somem',
      '// sozinhas, e o grafo pela metade se desenha sem nenhuma regra a mais.',
      tag([
        'nodes={nos.slice(0, 3)}',
        'edges={arestas}',
        'status="running"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function flowGraphWideSource(): string {
  return build({ status: 'running', nodesRef: 'nosLargos', edgesRef: 'arestasLargas' });
}

/** Rótulos longos, que quebram em vez de cortar. */
export function flowGraphLongLabelsSource(): string {
  return build({ status: 'running', nodesRef: 'nosLongos', edgesRef: 'arestasLongas' });
}

/** Um ramo que volta para uma coluna anterior. */
export function flowGraphRejoinSource(): string {
  return build({
    status: 'running',
    nodesRef: 'nosDoRetorno',
    edgesRef: 'arestasDoRetorno',
  });
}

/**
 * A largura mínima de coluna, na folha de quem consome.
 *
 * É ela que decide quando o grafo passa a ser mais largo que a conversa. Entra
 * como propriedade personalizada, e não como largura em `style`: é a única
 * maneira de mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function flowGraphTightColumnsSource(): string {
  return jsxSnippet(
    preamble('nos', 'arestas'),
    [
      tag([
        'nodes={nos}',
        'edges={arestas}',
        'status="running"',
        'labels={rotulos}',
      ]),
      '',
      '/* A largura MÍNIMA de coluna, na folha de quem consome. */',
      '.nds-flow-graph {',
      '  --flow-graph-column-min: var(--spacing-16);',
      '}',
    ].join('\n'),
  );
}
