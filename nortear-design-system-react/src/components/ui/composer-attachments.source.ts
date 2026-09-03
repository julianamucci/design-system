/**
 * Snippet do painel Code dos anexos — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * A FILA ENTRA RESUMIDA a três arquivos, com o comentário dizendo que é resumo:
 * despejar a fila inteira faria o painel ensinar o andaime em vez do
 * componente. Resumida, e não ELIDIDA — a versão anterior citava `labels` sem
 * nunca declará-lo, e quem copiava recebia um símbolo indefinido na primeira
 * renderização.
 *
 * OS DOIS OBJETOS DE RÓTULO ENTRAM INTEIROS. O campo exige os seis rótulos e a
 * fila exige a palavra de todos os estados e de todas as unidades: os tipos são
 * `Record` completo justamente para que uma chave faltando reprove a
 * compilação, em vez de anunciar um anexo sem estado que ninguém repara.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

/** Os rótulos do campo, por inteiro. `{key}` e `{max}` são moldes. */
const LABELS_BLOCK = [
  'const labels = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/** Os rótulos da fila, por inteiro. `{name}` vira o nome do arquivo. */
const ATTACHMENT_LABELS_BLOCK = [
  'const attachmentLabels = {',
  '  list: "Anexos",',
  '  remove: "Remover {name}",',
  '  state: {',
  '    pending: "Na fila",',
  '    uploading: "Enviando",',
  '    ready: "Pronto",',
  '    failed: "Falhou",',
  '  },',
  '  unit: { byte: "B", kb: "KB", mb: "MB", gb: "GB" },',
  '};',
].join('\n');

/** O nome da constante da fila que cada story declara. */
const QUEUE_DEFAULT = 'arquivos';

/** A fila de cada ramo, pelo nome com que o ramo a cita. */
const QUEUES: Record<string, string[]> = {
  arquivos: [
    '// A fila do exemplo tem um arquivo por estado — aqui, os três primeiros.',
    'const arquivos = [',
    '  { id: "a1", name: "planta.pdf", size: 2516582, state: "pending" },',
    '  { id: "a2", name: "medidas.csv", size: 840, state: "uploading", progress: 0.4 },',
    '  { id: "a3", name: "fachada.png", size: 2516582, state: "ready" },',
    '];',
  ],
  subindo: [
    'const subindo = [',
    '  { id: "a1", name: "planta.pdf", size: 2516582, state: "uploading", progress: 0.4 },',
    '];',
  ],
  falhou: [
    'const falhou = [',
    '  { id: "a1", name: "planta.pdf", size: 2516582, state: "failed" },',
    '];',
  ],
};

/**
 * O que se faz com o pedido de remoção.
 *
 * Uma linha, e o corpo é de quem consome: a peça relata o pedido e não tira
 * nada da fila sozinha — quem manda a fila nova é quem a mantém.
 */
const REMOVE_BLOCK = 'const remover = (id) => { /* … */ };';

/** O import, a fila do ramo e os dois objetos de rótulo. */
function preamble(queue?: string): string {
  const parts = [IMPORT, ''];
  const list = queue === undefined ? undefined : QUEUES[queue];
  if (list !== undefined) parts.push(list.join('\n'), '');
  parts.push(LABELS_BLOCK);
  if (list !== undefined) parts.push('', ATTACHMENT_LABELS_BLOCK, '', REMOVE_BLOCK);
  return parts.join('\n');
}

function build(queue: string = QUEUE_DEFAULT): string {
  return jsxSnippet(
    preamble(queue),
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
  return jsxSnippet(preamble(), '<Composer labels={labels} />');
}
