/**
 * Transforms do painel Code do rascunho recuperado.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos,
 * guarda o rascunho encontrado e faz alguma coisa com a escolha.
 *
 * O RASCUNHO APARECE COMO VARIÁVEL, e não como o texto por extenso: o assunto de
 * todos estes snippets é o que a faixa faz com o rascunho, e despejar seis
 * linhas de prosa dentro do binding faria o painel ensinar o exemplo em vez da
 * peça.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT_DRAFT =
  "import { NdsDraftRestore, type DraftRestoreAction } from '@/components/ui/draft-restore';";
const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type DraftSnippetOptions = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome da variável que carrega o rascunho — é o que muda entre os pontos. */
  draft?: string;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[], imports: string[]): string {
  return [
    ...imports,
    '',
    '@Component({',
    `  imports: [${imports.length > 1 ? 'NdsComposer, NdsDraftRestore' : 'NdsDraftRestore'}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/**
 * As linhas do retorno.
 *
 * Elas existem em todo snippet porque a escolha é o único retorno da peça — e é
 * a única coisa que a faixa faz além de mostrar o que encontrou.
 */
function actionHandler(): string[] {
  return [
    '',
    '  // Restaurar e descartar de verdade é daqui. O componente só avisa qual',
    '  // controle foi apertado: o que descartar apaga, se dá para desfazer e',
    '  // quando a faixa deixa de fazer sentido é de quem consome — e ela não',
    '  // sai da tela sozinha depois da resposta.',
    '  onAction(action: DraftRestoreAction): void {',
    "    if (action === 'restore') this.restore();",
    '    else this.discard();',
    '  }',
  ];
}

function draftSnippet(opts: DraftSnippetOptions = {}): string {
  const stored = opts.draft ?? 'rascunhoGuardado';

  const inner = [
    '    <nds-draft-restore',
    '      [labels]="labels"',
    '      [draft]="draft()"',
    // O carimbo chega JÁ ESCRITO: formato de data é decisão de idioma, e um
    // componente que o formatasse decidiria idioma em cinco lugares diferentes.
    ...(opts.timestamp ? [`      timestamp="${opts.timestamp}"`] : []),
    '      (action)="onAction($event)"',
    '    />',
  ];

  const body = [
    '  readonly labels = draftLabels();',
    '',
    '  // O rascunho vai INTEIRO. O corte de duas linhas é do desenho, e cortar',
    '  // antes tira do texto a busca do navegador e a leitura por completo.',
    `  readonly draft = signal(${stored});`,
    ...actionHandler(),
  ];

  return build(inner, body, [IMPORT_DRAFT]);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type DraftSourceTransform = (
  code?: string,
  ctx?: { args?: DraftSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que segue os controls.
 *
 * Só o carimbo entra por args: o rascunho é o texto por extenso, e imprimi-lo
 * dentro do binding faria o painel ensinar o exemplo em vez da peça.
 */
export const draftRestoreSource: DraftSourceTransform = (_code, ctx) =>
  draftSnippet({ timestamp: ctx?.args?.timestamp });

/**
 * Transforms de story: uma função NOMEADA por configuração.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet.
 */

/** Um rascunho encontrado, sem carimbo: não se sabe de quando ele é. */
export function draftFoundSource(): string {
  return draftSnippet({});
}

/** Com o carimbo, que chega já escrito — formato de data é decisão de idioma. */
export function draftDatedSource(): string {
  return draftSnippet({ timestamp: 'ontem, 14:32' });
}

/** Longo: quem corta é a folha, e o texto inteiro continua no documento. */
export function draftLongSource(): string {
  return draftSnippet({ draft: 'rascunhoLongoInteiro' });
}

/**
 * A faixa acima do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: a faixa é peça própria e fica ACIMA do campo — o campo não
 * sabe que ela existe, e nada nele muda por causa dela.
 */
export function draftAboveComposerSource(): string {
  const inner = [
    '    <!-- A faixa vem ANTES do campo na ordem de leitura, e não leva o foco. -->',
    '    <nds-draft-restore',
    '      [labels]="draftText"',
    '      [draft]="draft()"',
    '      timestamp="ontem, 14:32"',
    '      (action)="onAction($event)"',
    '    />',
    '',
    '    <nds-composer [labels]="labels" />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly draftText = draftLabels();',
    '',
    '  // O campo não sabe que a faixa existe: os dois são irmãos, e nada',
    '  // precisou ser acrescentado a ele.',
    '  readonly draft = signal(rascunhoGuardado);',
    ...actionHandler(),
  ];

  return build(inner, body, [IMPORT_COMPOSER, IMPORT_DRAFT]);
}
