/**
 * Snippet do painel Code da fila de envio — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a MENSAGEM por extenso, e é de propósito:
 * lá os controls mudam o estado e o texto, e um snippet que só mostrasse o nome
 * de uma constante mentiria sobre o que a story renderiza. Nas demais a fila é
 * dado de andaime — três falas de exemplo —, e despejá-la faria o painel
 * ensinar o andaime em vez da peça.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { MessageQueue } from "@/components/ui/message-queue";';

const IMPORT_COMPOSER = 'import { Composer } from "@/components/ui/composer";';

export type QueueSnippetOptions = {
  /** Em que ponto está a mensagem que o Playground desenha. */
  state?: string;
  /** O texto da mensagem do Playground. */
  text?: string;
};

/**
 * Os rótulos da fila, por INTEIRO.
 *
 * Não cabe resumir: `labels` é obrigatória e a palavra de cada estado é um
 * `Record` completo — um objeto pela metade não compila para quem copia. São
 * eles o nome acessível da lista, o nome do botão de retirar (com o texto da
 * mensagem dentro, para que três botões não se chamem todos "Retirar") e a
 * palavra que distingue a que já saiu, que a folha apenas deixa mais apagada.
 */
const QUEUE_LABELS_BLOCK = [
  'const queueLabels = {',
  '  list: "Mensagens na fila",',
  '  withdraw: "Retirar {text}",',
  '  state: { waiting: "Na fila", sending: "Enviando" },',
  '};',
].join('\n');

/**
 * Os rótulos do CAMPO, por inteiro, pelo mesmo motivo.
 *
 * Só entram no snippet que mostra as duas peças empilhadas — é lá que o campo
 * aparece, e é lá que a chamada dele precisa compilar.
 */
const COMPOSER_LABELS_BLOCK = [
  'const labels = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/**
 * O retorno ganha DECLARAÇÃO, e não só uma seta em linha.
 *
 * Retirar de verdade é de quem envia — a peça só avisa —, então o corpo fica
 * vazio de propósito. O nome, porém, precisa existir: `onWithdraw={(message)
 * => withdraw(message.id)}` sem `withdraw` em lugar nenhum entrega a quem
 * copia um `withdraw is not defined` no primeiro clique.
 */
const WITHDRAW_HANDLER =
  'const withdraw = (id) => { /* retirar de verdade é de quem envia */ };';

/**
 * A fila do exemplo, RESUMIDA a três falas.
 *
 * Resumida, e não elidida: a versão anterior citava `waitingQueue` sem nunca
 * declará-la. Três porque é a partir da terceira que a posição vira
 * informação — com duas, "a segunda" e "a última" são a mesma coisa. A fila
 * longa mostra as três primeiras das doze, que é o que cabe no painel.
 */
function queueLines(ref: string): string {
  const primeiraSaindo = ref !== 'waitingQueue';
  const nota =
    ref === 'longQueue'
      ? '// Uma fila que passa de nove — aqui, as três primeiras das doze.'
      : '// As três falas de exemplo, na ordem em que saem.';
  const estado = (indice: number) =>
    primeiraSaindo && indice === 0 ? 'sending' : 'waiting';
  return [
    nota,
    `const ${ref} = [`,
    ...[
      'Manda o resumo de ontem',
      'E o prazo?',
      'Inclui o gráfico de custo',
    ].map((texto, i) => `  { id: "m${i + 1}", text: "${texto}", state: "${estado(i)}" },`),
    '];',
  ].join('\n');
}

/** O que o snippet precisa ter à mão antes da chamada. */
type QueuePreambleOptions = {
  /** O nome da constante com a fila, quando ela não entra por extenso. */
  queueRef?: string;
  /** O snippet oferece retirar? */
  withdraw?: boolean;
  /** O snippet mostra o campo junto? */
  composer?: boolean;
};

/**
 * O preâmbulo: os imports e tudo que a chamada referencia.
 *
 * Cada ramo pede o seu — a fila só quando ela chega por nome, o retorno só
 * onde há o que retirar —, e é isso que faz o snippet de cada story compilar
 * inteiro na mão de quem o copia.
 */
function preamble(opts: QueuePreambleOptions = {}): string {
  const partes = [opts.composer ? `${IMPORT_COMPOSER}\n${IMPORT}` : IMPORT, QUEUE_LABELS_BLOCK];
  if (opts.queueRef && /^[A-Za-z_$][\w$]*$/.test(opts.queueRef)) {
    partes.push(queueLines(opts.queueRef));
  }
  if (opts.withdraw) partes.push(WITHDRAW_HANDLER);
  if (opts.composer) partes.push(COMPOSER_LABELS_BLOCK);
  return partes.join('\n\n');
}

/** A mensagem por extenso, na ordem em que o tipo a declara. */
function messageLiteral(opts: QueueSnippetOptions): string {
  const fields = [
    'id: "m1"',
    `text: "${text(opts.text) ?? 'E o prazo?'}"`,
    `state: "${text(opts.state) ?? 'waiting'}"`,
  ];
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

function build(opts: QueueSnippetOptions, messages: string): string {
  // Fila em que nada mais espera não oferece retirar coisa alguma, então o
  // retorno não teria como disparar: mostrá-lo ali ensinaria a ligar um fio
  // solto.
  const comRetorno = opts.state !== 'sending';
  return jsxSnippet(
    preamble({ queueRef: messages, withdraw: comRetorno }),
    `<MessageQueue${attrsMultilinha([
      'labels={queueLabels}',
      `messages={${messages}}`,
      comRetorno ? 'onWithdraw={(message) => withdraw(message.id)}' : undefined,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve a mensagem por extenso. */
export const messageQueueSource: SourceTransform<QueueSnippetOptions> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build(args, messageLiteral(args));
};

/** Três esperando a vez: todas se retiram. */
export function queueWaitingSource(): string {
  return build({}, 'waitingQueue');
}

/** A primeira já está indo, e as outras duas esperam. */
export function queueSendingSource(): string {
  return build({}, 'sendingQueue');
}

/** Uma fila que passa de nove, onde a posição ganha dois dígitos. */
export function queueLongSource(): string {
  return build({}, 'longQueue');
}

/**
 * A fila VAZIA.
 *
 * O componente devolve nada quando não há o que esperar, e o snippet mostra
 * justamente isso: quem consome passa a lista vazia e não desenha moldura
 * alguma em volta. Uma lista vazia seria anunciada como "lista com zero itens",
 * que promete algo que não há.
 */
export function queueEmptySource(): string {
  return jsxSnippet(preamble(), '<MessageQueue labels={queueLabels} messages={[]} />');
}

/**
 * A fila acima do campo.
 *
 * É o único snippet que mostra as duas peças juntas, porque é a única coisa que
 * a composição ensina: a fila é peça própria, e quem consome a empilha em cima
 * do campo. O campo não sabe que ela existe.
 */
export function queueAboveFieldSource(): string {
  return jsxSnippet(
    preamble({ queueRef: 'waitingQueue', withdraw: true, composer: true }),
    [
      '<div className="nds-stack" data-spacing="xs">',
      '  <MessageQueue',
      '    labels={queueLabels}',
      '    messages={waitingQueue}',
      '    onWithdraw={(message) => withdraw(message.id)}',
      '  />',
      '  <Composer labels={labels} />',
      '</div>',
    ].join('\n'),
  );
}
