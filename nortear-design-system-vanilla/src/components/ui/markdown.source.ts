// Snippet do painel Code do Markdown — ver `@/lib/story-source`.
//
// Sem isto o renderer html imprime o `outerHTML`: o documento inteiro já
// desenhado, dezenas de elementos, e nenhuma pista de como se chega nele. O que
// se escreve é uma chamada de fábrica com um texto — é isso que o painel mostra.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `MarkdownOptions` e que o snippet precisa mostrar. */
export type MarkdownSnippetOptions = {
  /** O documento. Vira o literal `answer` acima da chamada. */
  content?: string;
  streaming?: boolean;
  allow?: readonly string[];
  allowedProtocols?: readonly string[];
  /** A story registrou um ouvinte de clique de link? */
  onLinkClick?: boolean;
  class?: string;
};

/** Documento curto de reserva, para o snippet nunca sair sem conteúdo. */
const DEFAULT_DOCUMENT = '## Título\n\nUm parágrafo com **ênfase**.';

/**
 * O documento como template literal: ele tem quebras de linha, e achatá-las em
 * `'\n'` esconderia justamente a forma que o Markdown usa para significar.
 * Escapa o que fecharia a crase antes da hora.
 */
function documentLiteral(content: string): string {
  const body = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${body}\``;
}

/** `['paragraph', 'code']` — a lista branca como a story a escreveu. */
function listLiteral(values: readonly string[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  return `[${values.map((v) => text(v)).join(', ')}]`;
}

export function markdownSnippet(opts: MarkdownSnippetOptions = {}): string {
  const content = opts.content ?? DEFAULT_DOCUMENT;

  const lines = options([
    ['content', 'answer'],
    ['streaming', opts.streaming ? 'true' : undefined],
    ['allow', listLiteral(opts.allow)],
    ['allowedProtocols', listLiteral(opts.allowedProtocols)],
    // O corpo do ouvinte é da aplicação, não do componente: o snippet mostra
    // ONDE ele entra, sem inventar o que ele faz.
    ['onLinkClick', opts.onLinkClick ? '(url) => abrir(url)' : undefined],
    ['class', opts.class ? text(opts.class) : undefined],
  ]);

  return snippet(
    importing('markdown', 'createMarkdown'),
    `const answer = ${documentLiteral(content)};`,
    `const view = ${chamada('createMarkdown', lines)};`,
    montar('view'),
  );
}

/** Transform do painel Code: lê os args da story e devolve a chamada. */
export const markdownSource: SourceTransform<MarkdownSnippetOptions> = (_code, ctx) =>
  markdownSnippet(ctx?.args ?? {});

/** Transform de story que fixa opções por cima dos args do arquivo. */
export function markdownSourceWith(
  fixed: MarkdownSnippetOptions,
): SourceTransform<MarkdownSnippetOptions> {
  return (_gerado, ctx) => markdownSnippet({ ...ctx.args, ...fixed });
}
