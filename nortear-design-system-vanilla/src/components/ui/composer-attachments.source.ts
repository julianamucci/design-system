// Snippet do painel Code dos anexos — ver `@/lib/story-source`.
//
// A FILA não entra no snippet. Ela tem quatro arquivos com tamanho e estado, e
// despejá-la faria o painel ensinar o andaime em vez do componente. O snippet
// declara a constante e mostra o que se faz com ela: passar, e ouvir o pedido
// de remoção.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

export type AttachmentsSnippetOptions = {
  /** A story mostra a fila junto do campo? */
  withField?: boolean;
  /** Nome da constante da fila que o snippet declara. */
  queue?: string;
};

function build(opts: AttachmentsSnippetOptions = {}): string {
  const linhas = options([
    ['labels', 'rotulos'],
    ['attachmentLabels', 'rotulosDosAnexos'],
    ['attachments', opts.queue ?? 'arquivos'],
    ['onRemoveAttachment', '(anexo) => remover(anexo.id)'],
  ]);

  return snippet(
    importing('composer', 'createComposer'),
    `const composer = ${callLine('createComposer', linhas)};`,
    appendLine('composer'),
  );
}

/** Transform do `meta` — a forma básica. */
export const composerAttachmentsSource: SourceTransform<AttachmentsSnippetOptions> = (_c, ctx) =>
  build(ctx?.args ?? {});

/** A fila com um anexo em cada estado. */
export function attachmentsQueueSource(): string {
  return build({ queue: 'arquivos' });
}

/** Um anexo só, subindo. */
export function attachmentsUploadingSource(): string {
  return build({ queue: 'subindo' });
}

/** Um anexo só, que falhou. */
export function attachmentsFailedSource(): string {
  return build({ queue: 'falhou' });
}

/** A fila junto do campo. */
export function attachmentsWithFieldSource(): string {
  return build({ queue: 'arquivos', withField: true });
}

/**
 * O composer SEM anexo.
 *
 * O snippet não passa a fila nem os rótulos dela: sem anexo a fila não existe,
 * e mostrar as duas props aqui ensinaria a declarar o que não se usa.
 */
export function attachmentsAbsentSource(): string {
  return snippet(
    importing('composer', 'createComposer'),
    `const composer = ${callLine('createComposer', options([['labels', 'rotulos']]))};`,
    appendLine('composer'),
  );
}
