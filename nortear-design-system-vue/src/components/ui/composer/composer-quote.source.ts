/**
 * Transforms do painel Code da citação.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * O TRECHO não entra no snippet: ele é o conteúdo do exemplo, e despejá-lo
 * faria o painel ensinar a conversa em vez do componente. O snippet nomeia a
 * constante e mostra o que se faz com ela.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QuoteArgs = {
  /** Nome da constante da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/**
 * O `@dismiss-quote` entra SEMPRE.
 *
 * Sem ele o snippet ensinaria uma citação de onde não se sai — e o componente
 * não a tira por conta própria, de propósito: quem decide que a resposta deixou
 * de responder a alguém é quem consome. A linha existe para dizer onde a
 * responsabilidade continua.
 */
export function quoteSnippet(opts: QuoteArgs = {}): string {
  const attrs = attrsMultilinha([
    ':labels="rotulos"',
    ':quote-labels="rotulosDaCitacao"',
    `:quote="${opts.quote ?? 'citacao'}"`,
    opts.withAttachments && ':attachment-labels="rotulosDosAnexos"',
    opts.withAttachments && ':attachments="arquivos"',
    '@dismiss-quote="responder(null)"',
  ]);
  return vueSnippet(IMPORT, `<Composer${attrs} />`);
}

/** Transform do `meta` — lê os args da story e devolve o uso real. */
export const composerQuoteSource: SourceTransform<QuoteArgs> = (_gerado, ctx) =>
  quoteSnippet(ctx?.args ?? {});

/** A citação curta. */
export function quoteShortSource(): string {
  return quoteSnippet({ quote: 'citacao' });
}

/** A citação longa, que o desenho corta. */
export function quoteLongSource(): string {
  return quoteSnippet({ quote: 'citacaoLonga' });
}

/** Citação e anexos na mesma moldura. */
export function quoteWithAttachmentsSource(): string {
  return quoteSnippet({ quote: 'citacao', withAttachments: true });
}

/**
 * O composer SEM citação.
 *
 * O snippet não passa a citação nem os rótulos dela: sem citação o bloco não
 * existe, e mostrar as duas props ensinaria a declarar o que não se usa.
 */
export function quoteAbsentSource(): string {
  return vueSnippet(IMPORT, '<Composer :labels="rotulos" />');
}
