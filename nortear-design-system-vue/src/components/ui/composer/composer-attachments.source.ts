/**
 * Transforms do painel Code dos anexos.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * A FILA NÃO ENTRA NO SNIPPET. Ela tem quatro arquivos com tamanho e estado, e
 * despejá-la faria o painel ensinar o andaime em vez do componente. O snippet
 * nomeia a constante e mostra o que se faz com ela: passar, e ouvir o pedido de
 * remoção.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type AttachmentsArgs = {
  /** Nome da constante da fila que o snippet declara. */
  queue?: string;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/**
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * É a outra metade da decisão registrada logo abaixo: o `@remove-attachment`
 * entra sempre para dizer ONDE a responsabilidade continua, e um `remover` que
 * nunca fosse declarado diria isso ligando um nome que não resolve. Os rótulos
 * seguem o mesmo caminho — são texto de interface, e texto de interface é de
 * quem consome.
 */
const ROTULOS = [
  'const rotulos = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  "  attach: 'Anexar',",
  '};',
].join('\n');

const ROTULOS_DOS_ANEXOS = [
  'const rotulosDosAnexos = {',
  "  list: 'Anexos',",
  "  remove: 'Remover {name}',",
  "  state: { pending: 'Na fila', uploading: 'Enviando', ready: 'Pronto', failed: 'Falhou' },",
  "  unit: { byte: 'B', kb: 'KB', mb: 'MB', gb: 'GB' },",
  '};',
].join('\n');

const REMOVER = [
  'function remover(id: string) {',
  '  // Quem sobe o arquivo é quem sabe se dá para cancelar: a fila só avisa.',
  '  cancelarEnvio(id);',
  '}',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS, '', ROTULOS_DOS_ANEXOS, '', REMOVER].join('\n');
const SETUP_SEM_ANEXO = [IMPORT, '', ROTULOS].join('\n');

/**
 * O `@remove-attachment` entra SEMPRE.
 *
 * Sem ele o snippet ensinaria uma fila de onde não se tira nada — e o
 * componente não remove por conta própria, de propósito: quem sobe o arquivo é
 * quem sabe se dá para cancelar. A linha existe para dizer onde a
 * responsabilidade continua.
 */
export function attachmentsSnippet(opts: AttachmentsArgs = {}): string {
  const attrs = attrsMultilinha([
    ':labels="rotulos"',
    ':attachment-labels="rotulosDosAnexos"',
    `:attachments="${opts.queue ?? 'arquivos'}"`,
    '@remove-attachment="remover"',
  ]);
  return vueSnippet(SETUP, `<Composer${attrs} />`);
}

/** Transform do `meta` do Playground: lê os args da story e devolve o uso real. */
export const composerAttachmentsSource: SourceTransform<AttachmentsArgs> = (_gerado, ctx) =>
  attachmentsSnippet(ctx?.args ?? {});

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
  return vueSnippet(SETUP_SEM_ANEXO, '<Composer :labels="rotulos" />');
}
