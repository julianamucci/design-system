/**
 * Transforms do painel Code dos anexos.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, guarda a
 * fila e faz alguma coisa com o pedido de remoção.
 *
 * A FILA não entra no snippet. Ela tem quatro arquivos com tamanho e estado, e
 * despejá-la faria o painel ensinar o andaime em vez do componente. O snippet
 * declara o sinal e mostra o que se faz com ele.
 *
 * O `(removeAttachment)` entra SEMPRE que há fila, mesmo quando a story não
 * escuta nada. Sem ele o snippet ensinaria uma fila de onde não se tira nada —
 * que é o erro mais provável de quem copia, porque o componente não remove por
 * conta própria. A linha existe para dizer onde a responsabilidade continua.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type AttachmentsSnippetOptions = {
  /** Nome do sinal da fila que o snippet declara. */
  queue?: string;
  /** A story desenha o composer SEM anexo nenhum? */
  absent?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[]): string {
  return [
    IMPORT,
    '',
    '@Component({',
    '  imports: [NdsComposer],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

export function composerAttachmentsSnippet(opts: AttachmentsSnippetOptions = {}): string {
  // Sem anexo a fila não existe: o snippet não passa nem os arquivos nem os
  // rótulos deles, porque mostrar as duas entradas aqui ensinaria a declarar o
  // que não se usa.
  if (opts.absent) {
    return build(
      ['    <nds-composer [labels]="labels" />'],
      ['  readonly labels = composerLabels();'],
    );
  }

  const queue = opts.queue ?? 'files';

  const inner = [
    '    <nds-composer',
    '      [labels]="labels"',
    '      [attachmentLabels]="attachmentLabels"',
    `      [attachments]="${queue}()"`,
    '      (removeAttachment)="remove($event)"',
    '    />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly attachmentLabels = attachmentLabels();',
    '  // A fila é de quem sobe o arquivo: o componente desenha o que recebe.',
    `  readonly ${queue} = signal<Attachment[]>([]);`,
    '',
    '  // Remover de verdade é daqui. O componente só avisa que alguém pediu —',
    '  // e o que falhou continua na fila até esta decisão ser tomada.',
    '  remove(attachment: Attachment): void {',
    `    this.${queue}.update((current) => current.filter((a) => a !== attachment));`,
    '  }',
  ];

  return build(inner, body);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type AttachmentsSourceTransform = (
  code: string,
  ctx?: { args?: AttachmentsSnippetOptions },
) => string;

/** Transform do `meta` — a forma básica. */
export const composerAttachmentsSource: AttachmentsSourceTransform = (_code, ctx) =>
  composerAttachmentsSnippet(ctx?.args ?? {});

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolvia FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegavam ao snippet. Nomeadas, cada uma é verificada.
 */
const comFixas =
  (fixed: AttachmentsSnippetOptions): AttachmentsSourceTransform =>
  (_code, ctx) =>
    composerAttachmentsSnippet({ ...(ctx?.args ?? {}), ...fixed });

/** A fila com um arquivo subindo. */
export const attachmentsUploadingSource = comFixas({ queue: 'uploading' });

/** A fila com um arquivo que falhou. */
export const attachmentsFailedSource = comFixas({ queue: 'failed' });

/** O composer sem anexo nenhum. */
export const attachmentsAbsentSource = comFixas({ absent: true });
