/**
 * Transforms do painel Code do indicador de geração.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara a frase, monta o
 * lugar da resposta e faz a troca quando o texto chega.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT_INDICATOR =
  "import { NdsThinkingIndicator } from '@/components/ui/thinking-indicator';";
const IMPORT_MARKDOWN = "import { NdsMarkdown } from '@/components/ui/markdown';";
const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

/** A frase de exemplo. O painel ensina a peça, e a peça sempre diz alguma coisa. */
const DEFAULT_LABEL = 'Gerando resposta';

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type IndicatorSnippetOptions = {
  /** A frase que o Playground está anunciando. */
  label?: string;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type IndicatorSourceTransform = (
  code: string,
  ctx?: { args?: IndicatorSnippetOptions },
) => string;

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(imports: string[], declared: string[], inner: string[], body: string[]): string {
  return [
    ...imports,
    '',
    '@Component({',
    `  imports: [${declared.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    body.length ? 'export class Example {' : 'export class Example {}',
    ...body,
    ...(body.length ? ['}'] : []),
  ].join('\n');
}

/** A pergunta de exemplo, que é o que dá LUGAR ao indicador. */
const QUESTION = "  readonly question = 'Como o componente decide o que mostrar?';";

/**
 * Transform do `meta` — o Playground, com a frase dos controls.
 *
 * A frase entra por atributo, e não por binding: ela é texto fixo em quase toda
 * tela real, e mostrar o colchete aqui ensinaria uma cerimônia que ninguém
 * precisa.
 */
export const thinkingIndicatorSource: IndicatorSourceTransform = (_code, ctx) =>
  build(
    [IMPORT_INDICATOR],
    ['NdsThinkingIndicator'],
    [`    <p ndsThinkingIndicator label="${ctx?.args?.label || DEFAULT_LABEL}"></p>`],
    [],
  );

/** A espera: o indicador no lugar em que a resposta vai aparecer. */
export function indicatorWaitingSource(): string {
  return build(
    [IMPORT_MARKDOWN, IMPORT_INDICATOR],
    ['NdsMarkdown', 'NdsThinkingIndicator'],
    [
      '    <div class="nds-stack nds-max-w-lg" data-spacing="md">',
      '      <nds-markdown [content]="question" />',
      '      <!-- O indicador é o ÚLTIMO da conversa: ele ocupa o lugar do que ainda não veio. -->',
      `      <p ndsThinkingIndicator label="${DEFAULT_LABEL}"></p>`,
      '    </div>',
    ],
    [QUESTION],
  );
}

/**
 * O texto chegou.
 *
 * O snippet mostra os dois ramos juntos de propósito: sumir é a única regra da
 * peça que ela não pode cumprir sozinha, porque só quem monta a conversa sabe
 * que o primeiro trecho chegou.
 */
export function indicatorArrivedSource(): string {
  return build(
    [IMPORT_MARKDOWN, IMPORT_INDICATOR],
    ['NdsMarkdown', 'NdsThinkingIndicator'],
    [
      '    <!-- Chegou o texto: o indicador sai, e o lugar passa a ser da resposta. -->',
      '    @if (answer(); as text) {',
      '      <nds-markdown [content]="text" />',
      '    } @else {',
      `      <p ndsThinkingIndicator label="${DEFAULT_LABEL}"></p>`,
      '    }',
    ],
    [
      '  // Enquanto o primeiro trecho não chega, o lugar é do indicador.',
      "  readonly answer = signal('');",
    ],
  );
}

/** A troca inteira, do jeito que quem consome a escreve. */
export function indicatorReplacingSource(): string {
  return build(
    [IMPORT_MARKDOWN, IMPORT_INDICATOR],
    ['NdsMarkdown', 'NdsThinkingIndicator'],
    [
      '    <div class="nds-stack nds-max-w-lg" data-spacing="md">',
      '      <nds-markdown [content]="question" />',
      '      @if (answer(); as text) {',
      '        <nds-markdown [content]="text" />',
      '      } @else {',
      `        <p ndsThinkingIndicator label="${DEFAULT_LABEL}"></p>`,
      '      }',
      '    </div>',
    ],
    [
      QUESTION,
      "  readonly answer = signal('');",
      '',
      '  // Quando o primeiro trecho chega, quem monta a conversa faz a troca.',
      '  onChunk(chunk: string): void {',
      '    this.answer.update((current) => current + chunk);',
      '  }',
    ],
  );
}

/**
 * O indicador junto do campo que já oferece interromper.
 *
 * As duas peças falam da mesma espera e não se repetem: uma diz que a resposta
 * vem, a outra oferece o que fazer a respeito.
 */
export function indicatorWithComposerSource(): string {
  return build(
    [IMPORT_INDICATOR, IMPORT_COMPOSER],
    ['NdsThinkingIndicator', 'NdsComposer'],
    [
      `    <p ndsThinkingIndicator label="${DEFAULT_LABEL}"></p>`,
      '    <!-- Só o campo oferece o que acionar; o indicador não tem controle nenhum. -->',
      '    <nds-composer [labels]="labels" [running]="true" (stopped)="onStop()" />',
    ],
    [
      '  readonly labels = composerLabels();',
      '',
      '  // Interromper mora com quem já oferece o controle, e não com o indicador.',
      '  onStop(): void {',
      '    this.generation.abort();',
      '  }',
    ],
  );
}
