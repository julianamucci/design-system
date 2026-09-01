/**
 * Transforms do painel Code do grafo de fluxo.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para membros que só existem no arquivo de
 * story. O que se copia tem de ser o uso REAL: um componente que declara os
 * nós, as ligações e os rótulos.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * OS NÓS E AS LIGAÇÕES ENTRAM COMO NOME DE MEMBRO, e nunca por extenso. Seis
 * nós com cinco campos cada ocupariam a tela inteira do painel e não ensinariam
 * nada que o contrato já não diga — o que o snippet mostra é a CHAMADA, e o que
 * ela precisa: uma lista de nós, uma de ligações e os rótulos.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsFlowGraph } from '@/components/ui/flow-graph';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type FlowGraphSnippetOptions = {
  /** Em que pé está a execução que escreve o grafo. */
  status?: string;
  /** A expressão que produz os nós. */
  nodesExpression?: string;
  /** O nome do membro com as ligações, ou nada quando não há ligação. */
  edgesMember?: string;
  /** Linhas de comentário logo acima da peça, quando o desenho pede explicação. */
  note?: string[];
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    '  imports: [NdsFlowGraph],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** A peça, com as entradas que a configuração pede. */
function piece(opts: FlowGraphSnippetOptions, indent = '    '): string[] {
  return [
    `${indent}<div`,
    `${indent}  ndsFlowGraph`,
    `${indent}  [nodes]="${opts.nodesExpression ?? 'nos'}"`,
    ...(opts.edgesMember ? [`${indent}  [edges]="${opts.edgesMember}"`] : []),
    `${indent}  status="${opts.status ?? 'running'}"`,
    `${indent}  [labels]="rotulos"`,
    `${indent}></div>`,
  ];
}

/** A peça sozinha, na configuração que a story desenha. */
function single(opts: FlowGraphSnippetOptions): string {
  const nodesExpression = opts.nodesExpression ?? 'nos';
  // Sem nó nenhum a chamada continua existindo, e é o que a story mostra: a
  // peça é que decide se alguma coisa chega à tela.
  const declaresNodes = /\bnos\b/.test(nodesExpression);

  return build(
    [IMPORT],
    [...(opts.note ?? []), ...piece({ ...opts, nodesExpression })],
    [
      ...(declaresNodes
        ? [
            '  // Os nós vêm de quem monta o grafo: o endereço, o rótulo, a casa da',
            '  // grade e em que pé está cada passo.',
            '  readonly nos = nosDoAtendimento;',
          ]
        : []),
      ...(opts.edgesMember
        ? [`  readonly ${opts.edgesMember} = ligacoesDoAtendimento;`]
        : []),
      '  readonly rotulos = flowGraphLabels();',
    ],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve os eixos por extenso.
 *
 * Os args vêm dos controls: o estado, quantos nós entram e se houve ligação.
 */
export const flowGraphSource = (
  _code: string,
  ctx?: { args?: { status?: string; revealed?: number; withEdges?: boolean } },
): string => {
  const args = ctx?.args ?? {};
  const revealed = args.revealed ?? 4;
  return single({
    status: args.status,
    // REVELAR É PASSAR MENOS NÓS: o recorte é de quem monta, e é o que o
    // snippet ensina em vez de um contador que a peça não tem.
    nodesExpression: revealed === 0 ? '[]' : `nos.slice(0, ${revealed})`,
    edgesMember: args.withEdges === false ? undefined : 'ligacoes',
  });
};

/** Os quatro estados de nó, na mesma grade. */
export function flowGraphEveryStateSnippet(): string {
  return single({
    status: 'complete',
    edgesMember: 'ligacoes',
    note: [
      '    <!-- Um nó por estado, na mesma grade: os quatro têm forma própria, e',
      '         não só cor. A palavra de cada um chega a quem não vê a forma. -->',
    ],
  });
}

/** Um caminho que quebrou: o estado que a referência não tem. */
export function flowGraphFailureSnippet(): string {
  return single({ status: 'failed', edgesMember: 'ligacoes' });
}

/** Em andamento, com a execução ocupada. */
export function flowGraphRunningSnippet(): string {
  return single({ status: 'running', edgesMember: 'ligacoes' });
}

/**
 * O grafo pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de nós, e as
 * ligações que perderam uma ponta somem sozinhas.
 */
export function flowGraphPartialSnippet(): string {
  return single({
    status: 'running',
    nodesExpression: 'nos.slice(0, 3)',
    edgesMember: 'ligacoes',
    note: [
      '    <!-- REVELAR É PASSAR MENOS NÓS. As ligações que perderam uma ponta',
      '         somem sozinhas, e o grafo pela metade se desenha sem nenhuma',
      '         regra a mais. -->',
    ],
  });
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function flowGraphWideSnippet(): string {
  return single({ status: 'running', edgesMember: 'ligacoes' });
}

/** Rótulos longos, que quebram em vez de cortar. */
export function flowGraphLongLabelsSnippet(): string {
  return single({
    status: 'running',
    edgesMember: 'ligacoes',
    note: [
      '    <!-- O rótulo do nó nunca é cortado: ele quebra em várias linhas, e a',
      '         linha da grade cresce com ele. -->',
    ],
  });
}

/** Um ramo que volta para uma coluna anterior. */
export function flowGraphRejoinSnippet(): string {
  return single({
    status: 'running',
    edgesMember: 'ligacoes',
    note: [
      '    <!-- Um ramo que VOLTA: a ligação sai para a direita e chega pela',
      '         esquerda mesmo assim, e o laço que isso desenha é a informação. -->',
    ],
  });
}

/**
 * A largura mínima de coluna, na folha de quem consome.
 *
 * É ela que decide quando o grafo passa a ser mais largo que a conversa. Entra
 * como propriedade personalizada, e não como largura em estilo embutido: é a
 * única maneira de mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function flowGraphTightColumnsSnippet(): string {
  return [
    single({ status: 'running', edgesMember: 'ligacoes' }),
    '',
    '/* A largura MÍNIMA de coluna, na folha de quem consome. */',
    '.nds-flow-graph {',
    '  --flow-graph-column-min: var(--spacing-16);',
    '}',
  ].join('\n');
}
