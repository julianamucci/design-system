// Snippet do painel Code da citação — ver `@/lib/story-source`.
//
// O TRECHO não entra no snippet: ele é o conteúdo do exemplo, e despejá-lo
// faria o painel ensinar a conversa em vez do componente. O snippet declara a
// constante e mostra o que se faz com ela.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

export type QuoteSnippetOptions = {
  /** Nome da constante da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
};

function build(opts: QuoteSnippetOptions = {}): string {
  const linhas = options([
    ['labels', 'rotulos'],
    ['quoteLabels', 'rotulosDaCitacao'],
    ['quote', opts.quote ?? 'citacao'],
    ['attachmentLabels', opts.withAttachments ? 'rotulosDosAnexos' : undefined],
    ['attachments', opts.withAttachments ? 'arquivos' : undefined],
    ['onDismissQuote', '() => responder(null)'],
  ]);

  return snippet(
    importing('composer', 'createComposer'),
    `const composer = ${callLine('createComposer', linhas)};`,
    appendLine('composer'),
  );
}

/** Transform do `meta` — a forma básica. */
export const composerQuoteSource: SourceTransform<QuoteSnippetOptions> = (_c, ctx) =>
  build(ctx?.args ?? {});

/** A citação curta. */
export function quoteShortSource(): string {
  return build({ quote: 'citacao' });
}

/** A citação longa, que o desenho corta. */
export function quoteLongSource(): string {
  return build({ quote: 'citacaoLonga' });
}

/** Citação e anexos na mesma moldura. */
export function quoteWithAttachmentsSource(): string {
  return build({ quote: 'citacao', withAttachments: true });
}

/**
 * O composer SEM citação.
 *
 * O snippet não passa a citação nem os rótulos dela: sem citação o bloco não
 * existe, e mostrar as duas props ensinaria a declarar o que não se usa.
 */
export function quoteAbsentSource(): string {
  return snippet(
    importing('composer', 'createComposer'),
    `const composer = ${callLine('createComposer', options([['labels', 'rotulos']]))};`,
    appendLine('composer'),
  );
}
