/**
 * Transforms do painel Code do contexto.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, guarda as
 * referências e faz alguma coisa com o pedido de remoção.
 *
 * O Playground é o único que escreve o ITEM por extenso, e é de propósito: lá os
 * controls mudam espécie, recorte e a marca de automático, e um snippet que só
 * mostrasse o nome de um sinal mentiria sobre o que a story renderiza. Nas
 * demais o item é dado de andaime — cinco referências com espécie e recorte —, e
 * despejá-lo faria o painel ensinar o andaime em vez da peça.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ContextSnippetOptions = {
  /** Nome do sinal da lista que o snippet declara. */
  items?: string;
  /** Espécie do item que o Playground desenha. */
  kind?: string;
  /** Recorte do item do Playground. Vazio quando o item é o todo. */
  detail?: string;
  /** O item do Playground entrou sem ninguém pedir? */
  automatic?: boolean;
  /** O snippet escreve o item por extenso, em vez de uma lista vazia? */
  literal?: boolean;
  /** A story desenha o composer SEM contexto nenhum? */
  absent?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[]): string {
  return [
    IMPORT,
    '',
    '@Component({',
    '  imports: [NdsComposer],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** O item por extenso, na ordem em que o tipo o declara. */
function itemLiteral(opts: ContextSnippetOptions): string {
  const fields = [
    "label: 'relatorio.ts'",
    `kind: '${opts.kind ?? 'selection'}'`,
    opts.detail ? `detail: '${opts.detail}'` : undefined,
    opts.automatic ? 'automatic: true' : undefined,
  ].filter((field): field is string => field !== undefined);
  return `{ ${fields.join(', ')} }`;
}

function composerContextSnippet(opts: ContextSnippetOptions = {}): string {
  // Sem item a lista não existe: o snippet não passa nem as referências nem os
  // rótulos delas, porque mostrar as duas entradas aqui ensinaria a declarar o
  // que não se usa.
  if (opts.absent) {
    return build(
      ['    <nds-composer [labels]="labels" />'],
      ['  readonly labels = composerLabels();'],
    );
  }

  const items = opts.items ?? 'references';
  // Item automático não oferece botão de remover, então a saída não teria como
  // disparar: mostrá-la ali ensinaria a ligar um fio solto.
  const removable = !opts.automatic;
  const seed = opts.literal ? `[\n    ${itemLiteral(opts)},\n  ]` : '[]';

  const inner = [
    '    <nds-composer',
    '      [labels]="labels"',
    '      [contextLabels]="contextLabels"',
    `      [context]="${items}()"`,
    ...(removable ? [`      (removeContext)="remove($event)"`] : []),
    '    />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly contextLabels = contextLabels();',
    '  // O contexto é de quem monta a pergunta: o componente desenha o que recebe.',
    `  readonly ${items} = signal<ContextItem[]>(${seed});`,
  ];

  if (removable) {
    body.push(
      '',
      '  // Tirar de verdade é daqui. O componente só avisa que alguém pediu —',
      '  // e decidir o que sobra sem aquele item é de quem monta a pergunta.',
      '  remove(item: ContextItem): void {',
      `    this.${items}.update((current) => current.filter((c) => c !== item));`,
      '  }',
    );
  }

  return build(inner, body);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ContextSourceTransform = (
  code: string,
  ctx?: { args?: ContextSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve o item por extenso.
 *
 * Os args vêm dos controls: espécie, recorte e a marca de automático.
 */
export const composerContextSource: ContextSourceTransform = (_code, ctx) =>
  composerContextSnippet({ ...(ctx?.args ?? {}), literal: true });

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: ContextSnippetOptions): ContextSourceTransform {
  return (_code, ctx) => composerContextSnippet({ ...(ctx?.args ?? {}), ...fixed });
}

/** Uma etiqueta por espécie. */
export const contextEveryKindSource = withFixed({ items: 'references', literal: false });

/** O trecho, com o recorte que o separa do arquivo inteiro. */
export const contextSelectionSource = withFixed({ items: 'excerpt', literal: false });

/** Só o repositório — a espécie mais larga. */
export const contextRepositorySource = withFixed({ items: 'repositories', literal: false });

/** O que entrou sozinho, sem botão para tirá-lo. */
export const contextAutomaticSource = withFixed({
  items: 'automatic',
  literal: false,
  automatic: true,
});

/** A lista junto do campo. */
export const contextWithFieldSource = withFixed({ items: 'references', literal: false });

/**
 * O composer SEM contexto.
 *
 * O snippet não passa a lista nem os rótulos dela: sem item a lista não existe,
 * e mostrar as duas entradas aqui ensinaria a declarar o que não se usa.
 */
export const contextAbsentSource = withFixed({ absent: true });
