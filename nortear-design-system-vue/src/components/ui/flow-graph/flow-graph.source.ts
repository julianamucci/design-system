/**
 * Transforms do painel Code do grafo de fluxo.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * OS NÓS E AS LIGAÇÕES ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis
 * nós com quatro campos cada ocupariam a tela inteira do painel e não
 * ensinariam nada que o contrato já não diga — o que o snippet mostra é a
 * CHAMADA, e o que ela precisa: uma lista de nós, uma de ligações e os rótulos.
 */
import { indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type FlowGraphSnippetOptions = {
  /** Em que pé está a execução que escreve o grafo. */
  status?: string;
  /** O nome da constante com os nós. */
  nodesRef?: string;
  /** O nome da constante com as ligações. */
  edgesRef?: string;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { FlowGraph } from '@/components/ui/flow-graph';";

/**
 * Os rótulos que o exemplo DECLARA.
 *
 * `:labels="rotulos"` nomeia texto de interface, que é de quem consome — e o
 * exemplo não o declarava em lugar nenhum: quem copiasse recebia um `labels`
 * indefinido, e é ele que descreve o desenho a quem não vê a seta.
 */
const ROTULOS = [
  'const rotulos = {',
  "  region: 'Fluxo do atendimento',",
  "  dependsOn: 'Depende de {sources}.',",
  "  state: { pending: 'Por fazer', running: 'Em andamento', done: 'Concluído', failed: 'Falhou' },",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS].join('\n');

/**
 * A tag da peça, com um atributo por linha.
 *
 * Ela não tem evento nenhum e não abre espaço nenhum: um nó não faz nada, e o
 * grafo não tem parte de quem consome. O snippet é só o que ela recebe.
 */
function flowGraphTag(opts: FlowGraphSnippetOptions): string {
  const attributes = [
    `:nodes="${opts.nodesRef ?? 'nos'}"`,
    opts.edgesRef === undefined ? undefined : `:edges="${opts.edgesRef}"`,
    `status="${text(opts.status, 'running')}"`,
    ':labels="rotulos"',
  ].filter((part): part is string => Boolean(part));

  return ['<FlowGraph', ...attributes.map((part) => indentar(part)), '/>'].join('\n');
}

function build(opts: FlowGraphSnippetOptions): string {
  return vueSnippet(SETUP, flowGraphTag(opts));
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const flowGraphSource: SourceTransform<{
  status: string;
  revealed: number;
  withEdges: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem nó nenhum a chamada continua existindo, e é o que a story mostra: a
    // peça é que decide não desenhar.
    nodesRef: args.revealed === 0 ? '[]' : 'nos',
    edgesRef: args.withEdges === false ? undefined : 'arestas',
  });
};

/** Os quatro estados de nó, na mesma grade. */
export function flowGraphEveryStateSnippet(): string {
  return vueSnippet(
    SETUP,
    [
      '<!-- Um nó por estado, na mesma grade: os quatro têm forma própria, e não',
      '     só cor. A palavra de cada um chega a quem não vê a forma. -->',
      flowGraphTag({ status: 'complete', edgesRef: 'arestas' }),
    ].join('\n'),
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
  return vueSnippet(
    SETUP,
    [
      '<!-- REVELAR É PASSAR MENOS NÓS. As ligações que perderam uma ponta somem',
      '     sozinhas, e o grafo pela metade se desenha sem nenhuma regra a mais. -->',
      flowGraphTag({ status: 'running', nodesRef: 'nos.slice(0, 3)', edgesRef: 'arestas' }),
    ].join('\n'),
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
  const stylesheet = [
    '<style>',
    '/* A largura MÍNIMA de coluna, na folha de quem consome. */',
    '.nds-flow-graph {',
    '  --flow-graph-column-min: var(--spacing-16);',
    '}',
    '</' + 'style>',
  ].join('\n');

  return [build({ status: 'running', edgesRef: 'arestas' }), stylesheet].join('\n\n');
}

