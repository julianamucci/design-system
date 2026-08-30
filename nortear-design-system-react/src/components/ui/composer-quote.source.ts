/**
 * Snippet do painel Code da citação — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * O TRECHO não entra no snippet: ele é o conteúdo do exemplo, e despejá-lo
 * faria o painel ensinar a conversa em vez do componente. O snippet declara a
 * constante e mostra o que se faz com ela.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

export type QuoteSnippetOptions = {
  /** Nome da constante da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
};

function build(opts: QuoteSnippetOptions = {}): string {
  return jsxSnippet(
    IMPORT,
    `<Composer${attrsMultilinha([
      'labels={labels}',
      'quoteLabels={quoteLabels}',
      `quote={${opts.quote ?? 'citacao'}}`,
      opts.withAttachments ? 'attachmentLabels={attachmentLabels}' : undefined,
      opts.withAttachments ? 'attachments={arquivos}' : undefined,
      'onDismissQuote={() => responder(null)}',
    ])} />`,
  );
}

/**
 * Transform do `meta` — a forma básica.
 *
 * Não lê `ctx.args`, e não é esquecimento: o eixo desta peça é ESTADO — com
 * citação, com trecho longo, sem citação —, então ela não tem `argTypes` nem
 * controls, e não há arg de onde ler.
 */
export const composerQuoteSource: SourceTransform<QuoteSnippetOptions> = () => build();

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
  return jsxSnippet(IMPORT, '<Composer labels={labels} />');
}
