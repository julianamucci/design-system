/**
 * Transforms do painel Code do Markdown.
 *
 * Módulo de TS puro: o renderer Angular imprime no painel o `template` da story
 * como está escrito, com os bindings apontando para `props` que só existem no
 * arquivo de story. O que se copia tem de ser o uso REAL — um componente com o
 * documento declarado.
 *
 * A armadilha própria deste componente: o documento chega por input de TEXTO e
 * tem quebras de linha que SIGNIFICAM — a linha em branco entre parágrafos é a
 * sintaxe. Cada linha entra como item de um `join('\n')`, e não dentro de um
 * template literal recuado: recuo no começo de uma linha de Markdown gruda a
 * linha no parágrafo anterior, e com quatro casas vira bloco de código.
 *
 * Uma transform por story, todas chamáveis sem argumento.
 */
import { ALLOW_PRESETS, type MdBlockKind } from '@shared/primitives/markdown-ast';
import {
  MARKDOWN_CODE,
  MARKDOWN_COMMENT,
  MARKDOWN_STREAMING,
  MARKDOWN_TABLE,
  MARKDOWN_UNSAFE,
} from '@shared/primitives/markdown-examples';

export type MarkdownArgs = {
  content: string;
  streaming: boolean;
  allow: readonly MdBlockKind[];
  allowedProtocols: readonly string[];
  linkClick: unknown;
  class: string;
};

/** Documento curto de reserva, para o snippet nunca sair sem conteúdo. */
const DEFAULT_DOCUMENT = '## Título\n\nUm parágrafo com **ênfase**.';

/**
 * O documento como literal de linhas.
 *
 * `join('\n')` em vez de crase por dois motivos: o texto pode TRAZER crase (todo
 * documento com bloco de código traz três), e uma crase dentro de outra
 * deixaria de ser o texto que a pessoa copia. Aspas simples do conteúdo saem
 * escapadas.
 */
function documentLiteral(content: string): string {
  const lines = content.split('\n').map((line) => `  '${line.replace(/(['\\])/g, '\\$1')}',`);
  return ['[', ...lines, "].join('\\n')"].join('\n');
}

/** `[allow]="['paragraph', 'code']"` — só quando a story restringe. */
function attrList(name: string, value: readonly string[] | undefined): string | null {
  if (!value || value.length === 0) return null;
  return `      [${name}]="[${value.map((v) => `'${v}'`).join(', ')}]"`;
}

/** Um snippet completo: o componente que se escreve para usar isto. */
function build(content: string, extra: Array<string | null> = []): string {
  const attrs = ['      [content]="answer"', ...extra.filter((x): x is string => Boolean(x))];
  return [
    "import { NdsMarkdown } from '@/components/ui/markdown';",
    '',
    '@Component({',
    '  imports: [NdsMarkdown],',
    '  template: `',
    '    <nds-markdown',
    ...attrs,
    '    />',
    '  `,',
    '})',
    'export class Exemplo {',
    `  readonly answer = ${documentLiteral(content).split('\n').map((l, i) => (i === 0 ? l : `  ${l}`)).join('\n')};`,
    '}',
  ].join('\n');
}

/**
 * Transform do `meta` do Playground — lê os args e monta o snippet.
 *
 * `allow` só aparece quando a story RESTRINGE: o Playground marca os oito
 * blocos, e listá-los repetiria o padrão do componente como se fosse decisão.
 */
export function markdownSource(_gerado: string, ctx: { args?: Partial<MarkdownArgs> }): string {
  const args = ctx.args ?? {};
  const content = typeof args.content === 'string' && args.content !== ''
    ? args.content
    : DEFAULT_DOCUMENT;
  const allow = Array.isArray(args.allow) && args.allow.length < 8 ? args.allow : undefined;
  return build(content, [
    args.streaming ? '      [streaming]="true"' : null,
    attrList('allow', allow),
    attrList('allowedProtocols', args.allowedProtocols),
    // O corpo do ouvinte é da aplicação, não do componente: o snippet mostra
    // ONDE ele entra, sem inventar o que ele faz.
    args.linkClick ? '      (linkClick)="abrir($event)"' : null,
  ]);
}

/** Lista branca completa: o padrão, e por isso sem `allow` no snippet. */
export function markdownFullSource(): string {
  return build(MARKDOWN_COMMENT);
}

/** Bolha de conversa: sem título e sem tabela. */
export function markdownChatSource(): string {
  return build(MARKDOWN_COMMENT, [attrList('allow', ALLOW_PRESETS.chat)]);
}

/** Campo de comentário: só texto corrido. */
export function markdownCommentSource(): string {
  return build(MARKDOWN_COMMENT, [attrList('allow', ALLOW_PRESETS.comment)]);
}

/** Resposta ainda chegando, com a cerca de código aberta. */
export function markdownStreamingSource(): string {
  return build(MARKDOWN_STREAMING, ['      [streaming]="true"']);
}

/** Entrada hostil: nada dela vira marcação, e nada dela some. */
export function markdownRefusedSource(): string {
  return build(MARKDOWN_UNSAFE);
}

/** Documento vazio: nada desenhado, e sem caixa ocupando espaço. */
export function markdownEmptySource(): string {
  return build('');
}

/** Bloco de código, delegado ao CodeBlock. */
export function markdownCodeBlockSource(): string {
  return build(MARKDOWN_CODE);
}

/** Tabela do GFM, delegada à Table. */
export function markdownTableSource(): string {
  return build(MARKDOWN_TABLE);
}
