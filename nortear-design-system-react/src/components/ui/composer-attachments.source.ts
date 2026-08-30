/**
 * Snippet do painel Code dos anexos — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * A FILA não entra no snippet. Ela tem quatro arquivos com tamanho e estado, e
 * despejá-la faria o painel ensinar o andaime em vez do componente. O snippet
 * declara a constante e mostra o que se faz com ela: passar, e ouvir o pedido
 * de remoção.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

/** O nome da constante da fila que cada story declara. */
const QUEUE_DEFAULT = 'arquivos';

function build(queue: string = QUEUE_DEFAULT): string {
  return jsxSnippet(
    IMPORT,
    `<Composer${attrsMultilinha([
      'labels={labels}',
      'attachmentLabels={attachmentLabels}',
      `attachments={${queue}}`,
      'onRemoveAttachment={(anexo) => remover(anexo.id)}',
    ])} />`,
  );
}

/**
 * Transform do `meta` — a forma básica.
 *
 * Não lê `ctx.args`, e não é esquecimento: o eixo desta peça é ESTADO, então
 * ela não tem `argTypes` nem controls, e não há arg de onde ler.
 */
export const composerAttachmentsSource: SourceTransform<Record<string, unknown>> = () =>
  build();

/** A fila com um anexo em cada estado. */
export function attachmentsQueueSource(): string {
  return build();
}

/** Um anexo só, subindo. */
export function attachmentsUploadingSource(): string {
  return build('subindo');
}

/** Um anexo só, que falhou. */
export function attachmentsFailedSource(): string {
  return build('falhou');
}

/** A fila junto do campo. */
export function attachmentsWithFieldSource(): string {
  return build();
}

/**
 * O composer SEM anexo.
 *
 * O snippet não passa a fila nem os rótulos dela: sem anexo a fila não existe,
 * e mostrar as duas props aqui ensinaria a declarar o que não se usa.
 */
export function attachmentsAbsentSource(): string {
  return jsxSnippet(IMPORT, '<Composer labels={labels} />');
}
