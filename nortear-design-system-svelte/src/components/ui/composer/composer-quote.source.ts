/**
 * Transforms do painel Code da citação.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * O TRECHO não entra no snippet: ele é o conteúdo do exemplo, e despejá-lo
 * faria o painel ensinar a conversa em vez do componente. O snippet nomeia a
 * constante e mostra o que se faz com ela.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QuoteArgs = {
  /** Nome da constante da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/**
 * O `onDismissQuote` entra SEMPRE.
 *
 * Sem ele o snippet ensinaria uma citação de onde não se sai — e o componente
 * não a tira por conta própria, de propósito: quem decide que a resposta deixou
 * de responder a alguém é quem consome. A linha existe para dizer onde a
 * responsabilidade continua.
 */
export function quoteSnippet(opts: QuoteArgs = {}): string {
  const attrs = attrsMultilinha([
    '{labels}',
    '{quoteLabels}',
    `quote={${opts.quote ?? 'citacao'}}`,
    opts.withAttachments && '{attachmentLabels}',
    opts.withAttachments && 'attachments={arquivos}',
    'onDismissQuote={() => responder(null)}',
  ]);
  const script = [
    IMPORT,
    '',
    'const labels = { /* os rótulos do campo */ };',
    'const quoteLabels = { /* os rótulos da citação */ };',
    '',
    '// A citação é de quem monta a conversa: de quem é o trecho e o que ele diz.',
    `const ${opts.quote ?? 'citacao'} = { /* o trecho citado */ };`,
    ...(opts.withAttachments
      ? [
          '',
          "const attachmentLabels = { /* os rótulos da fila */ };",
          'const arquivos = [/* os anexos da fila */];',
        ]
      : []),
    '',
    '// Sair da citação é de quem consome: a peça avisa, e não a tira por conta',
    '// própria.',
    'function responder(alvo) { /* passa a responder a esse trecho, ou a nenhum */ }',
  ].join('\n');
  return svelteSnippet(script, `<Composer${attrs} />`);
}

/** Transform do `meta` — a forma básica. */
export function composerQuoteSource(): string {
  return quoteSnippet();
}

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
  return svelteSnippet(
    [IMPORT, '', 'const labels = { /* os rótulos do campo */ };'].join('\n'),
    '<Composer {labels} />',
  );
}
