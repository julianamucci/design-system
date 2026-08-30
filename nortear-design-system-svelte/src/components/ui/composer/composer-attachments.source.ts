/**
 * Transforms do painel Code dos anexos.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * A FILA NÃO ENTRA NO SNIPPET. Ela tem quatro arquivos com tamanho e estado, e
 * despejá-la faria o painel ensinar o andaime em vez do componente. O snippet
 * nomeia a constante e mostra o que se faz com ela: passar, e ouvir o pedido de
 * remoção.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type AttachmentsArgs = {
  /** Nome da constante da fila que o snippet declara. */
  queue?: string;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/**
 * O `onRemoveAttachment` entra SEMPRE.
 *
 * Sem ele o snippet ensinaria uma fila de onde não se tira nada — e o
 * componente não remove por conta própria, de propósito: quem sobe o arquivo é
 * quem sabe se dá para cancelar. A linha existe para dizer onde a
 * responsabilidade continua.
 */
export function attachmentsSnippet(opts: AttachmentsArgs = {}): string {
  const attrs = attrsMultilinha([
    '{labels}',
    '{attachmentLabels}',
    `attachments={${opts.queue ?? 'arquivos'}}`,
    'onRemoveAttachment={(anexo) => remover(anexo.id)}',
  ]);
  return svelteSnippet(IMPORT, `<Composer${attrs} />`);
}

/** Transform do `meta` do Playground: a forma básica. */
export function composerAttachmentsSource(): string {
  return attachmentsSnippet();
}

/** A fila com um anexo em cada estado. */
export function attachmentsQueueSource(): string {
  return attachmentsSnippet({ queue: 'arquivos' });
}

/** Um anexo só, subindo. */
export function attachmentsUploadingSource(): string {
  return attachmentsSnippet({ queue: 'subindo' });
}

/** Um anexo só, que falhou. */
export function attachmentsFailedSource(): string {
  return attachmentsSnippet({ queue: 'falhou' });
}

/** A fila junto do campo. */
export function attachmentsWithFieldSource(): string {
  return attachmentsSnippet({ queue: 'arquivos' });
}

/**
 * O composer SEM anexo.
 *
 * O snippet não passa a fila nem os rótulos dela: sem anexo a fila não existe,
 * e mostrar as duas props aqui ensinaria a declarar o que não se usa.
 */
export function attachmentsAbsentSource(): string {
  return svelteSnippet(IMPORT, '<Composer {labels} />');
}
