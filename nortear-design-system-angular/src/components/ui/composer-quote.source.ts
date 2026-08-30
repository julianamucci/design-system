/**
 * Transforms do painel Code da citação.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, guarda a
 * citação e faz alguma coisa com o pedido de dispensa.
 *
 * O TRECHO não entra no snippet: ele é o conteúdo do exemplo, e despejá-lo faria
 * o painel ensinar a conversa em vez do componente. O snippet declara o sinal e
 * mostra o que se faz com ele.
 *
 * O `(dismissQuote)` entra SEMPRE que há citação, mesmo quando a story não
 * escuta nada. Sem ele o snippet ensinaria uma citação de que não se sai — que é
 * o erro mais provável de quem copia, porque o componente não a tira por conta
 * própria. A linha existe para dizer onde a responsabilidade continua.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type QuoteSnippetOptions = {
  /** Nome do sinal da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
  /** A story desenha o composer SEM citação nenhuma? */
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

export function composerQuoteSnippet(opts: QuoteSnippetOptions = {}): string {
  // Sem citação o bloco não existe: o snippet não passa nem a citação nem os
  // rótulos dela, porque mostrar as duas entradas aqui ensinaria a declarar o
  // que não se usa.
  if (opts.absent) {
    return build(
      ['    <nds-composer [labels]="labels" />'],
      ['  readonly labels = composerLabels();'],
    );
  }

  const quote = opts.quote ?? 'quote';

  const inner = [
    '    <nds-composer',
    '      [labels]="labels"',
    '      [quoteLabels]="quoteLabels"',
    `      [quote]="${quote}()"`,
    ...(opts.withAttachments
      ? [
          '      [attachmentLabels]="attachmentLabels"',
          '      [attachments]="files()"',
        ]
      : []),
    '      (dismissQuote)="dismiss()"',
    '    />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly quoteLabels = quoteLabels();',
    '  // O trecho vai INTEIRO: quem corta é a folha, por linha.',
    `  readonly ${quote} = signal<ComposerQuote | undefined>(undefined);`,
    ...(opts.withAttachments
      ? [
          '  readonly attachmentLabels = attachmentLabels();',
          '  readonly files = signal<Attachment[]>([]);',
        ]
      : []),
    '',
    '  // Tirar a citação é daqui. O componente só avisa que alguém pediu —',
    '  // ele não decide que a resposta deixou de responder a alguém.',
    '  dismiss(): void {',
    `    this.${quote}.set(undefined);`,
    '  }',
  ];

  return build(inner, body);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type QuoteSourceTransform = (
  code: string,
  ctx?: { args?: QuoteSnippetOptions },
) => string;

/** Transform do `meta` — a forma básica. */
export const composerQuoteSource: QuoteSourceTransform = (_code, ctx) =>
  composerQuoteSnippet(ctx?.args ?? {});

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolvia FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegavam ao snippet. Nomeadas, cada uma é verificada.
 */
const comFixas =
  (fixed: QuoteSnippetOptions): QuoteSourceTransform =>
  (_code, ctx) =>
    composerQuoteSnippet({ ...(ctx?.args ?? {}), ...fixed });

/** Citação curta — a forma básica. */
export const composerQuoteShortSource = comFixas({});

/** Citação longa: o corte por linha é da folha, e o snippet é o mesmo. */
export const composerQuoteLongSource = comFixas({ quote: 'longQuote' });

/** Citação e anexos ao mesmo tempo. */
export const composerQuoteWithAttachmentsSource = comFixas({ withAttachments: true });

/** O composer sem citação nenhuma. */
export const composerQuoteAbsentSource = comFixas({ absent: true });
