// Snippet do painel Code do rascunho recuperado — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O rascunho aparece como VARIÁVEL, e não como o texto por extenso: o assunto
// de todos estes snippets é o que a faixa faz com o rascunho, e despejar seis
// linhas de prosa dentro da chamada faria o painel ensinar o exemplo em vez da
// peça.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type DraftSnippetOptions = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome da variável que carrega o rascunho — é o que muda entre os casos. */
  draft?: string;
};

function build(opts: DraftSnippetOptions): string {
  const lines = options([
    ['labels', 'rotulos'],
    // O rascunho vai INTEIRO. O corte de duas linhas é da folha, e é o que o
    // mantém achável pela busca do navegador e audível por completo.
    ['draft', opts.draft ?? 'rascunhoGuardado'],
    ['timestamp', opts.timestamp ? text(opts.timestamp) : undefined],
    ['onAction', "(action) => (action === 'restore' ? restaurar() : descartar())"],
  ]);

  return snippet(
    importing('draft-restore', 'createDraftRestore'),
    `const draft = ${callLine('createDraftRestore', lines)};`,
    appendLine('draft'),
  );
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const draftRestoreSource: SourceTransform<DraftSnippetOptions> = (_c, ctx) => {
  return build({ timestamp: ctx?.args?.timestamp });
};

/** Um rascunho encontrado, sem carimbo: não se sabe de quando ele é. */
export function draftFoundSource(): string {
  return build({});
}

/** Com o carimbo, que chega já escrito — formato de data é decisão de idioma. */
export function draftDatedSource(): string {
  return build({ timestamp: 'ontem, 14:32' });
}

/** Longo: quem corta é a folha, e o texto inteiro continua no documento. */
export function draftLongSource(): string {
  return build({ draft: 'rascunhoLongoInteiro' });
}

/**
 * A faixa acima do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: a faixa é peça própria e fica ACIMA do campo — o campo
 * não sabe que ela existe, e nada nele muda por causa dela.
 */
export function draftAboveComposerSource(): string {
  const draft = callLine('createDraftRestore', options([
    ['labels', 'rotulosDoRascunho'],
    ['draft', 'rascunhoGuardado'],
    ['timestamp', text('ontem, 14:32')],
    ['onAction', "(action) => (action === 'restore' ? restaurar() : descartar())"],
  ]));

  const composer = callLine('createComposer', options([
    ['labels', 'rotulos'],
  ]));

  return snippet(
    importing('composer', 'createComposer'),
    importing('draft-restore', 'createDraftRestore'),
    `const draft = ${draft};`,
    `const composer = ${composer};`,
    '// A faixa vem ANTES do campo na ordem de leitura, e não leva o foco.',
    appendLine('draft'),
    appendLine('composer'),
  );
}
