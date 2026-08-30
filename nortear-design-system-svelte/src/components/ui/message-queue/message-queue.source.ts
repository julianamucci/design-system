/**
 * Transforms do painel Code da fila de envio.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
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
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QueueSnippetOptions = {
  /** Em que ponto está a mensagem que o Playground desenha. */
  state?: string;
  /** O texto da mensagem do Playground. */
  text?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: QueueSnippetOptions };

const IMPORT = "import { MessageQueue } from '@/components/ui/message-queue';";
const IMPORT_FIELD = "import { Composer } from '@/components/ui/composer';";

/** Texto em aspas simples, com a aspa do próprio texto escapada. */
function quoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** A mensagem por extenso, na ordem em que o tipo a declara. */
function messageLiteral(opts: QueueSnippetOptions): string {
  const fields = [
    `id: ${quoted('m1')}`,
    `text: ${quoted(opts.text ?? 'E o prazo?')}`,
    `state: ${quoted(opts.state ?? 'waiting')}`,
  ];
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

/** O uso real: a fila, os rótulos dela, e onde o pedido de retirada continua. */
function queueMarkup(opts: QueueSnippetOptions, messages: string): string {
  const attributes = attrsMultilinha([
    '{labels}',
    `messages={${messages}}`,
    // Fila em que nada mais espera não oferece retirar coisa alguma, então o
    // retorno não teria como disparar: mostrá-lo ali ensinaria a ligar um fio
    // solto.
    opts.state !== 'sending' && 'onWithdraw={(message) => withdraw(message.id)}',
  ]);
  return `<MessageQueue${attributes} />`;
}

function build(opts: QueueSnippetOptions, messages: string): string {
  return svelteSnippet(IMPORT, queueMarkup(opts, messages));
}

/** Transform do `meta` — o Playground, que escreve a mensagem por extenso. */
export function messageQueueSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build(args, messageLiteral(args));
}

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
 * A peça não desenha nada quando não há o que esperar, e o snippet mostra
 * justamente isso: quem consome passa a lista como ela está, sem guardar a
 * chamada atrás de um teste. Uma lista vazia seria anunciada como "lista com
 * zero itens", que promete algo que não há.
 */
export function queueEmptySource(): string {
  return svelteSnippet(
    IMPORT,
    '<!-- Sem mensagem nenhuma, a fila não chega ao documento. -->\n<MessageQueue {labels} messages={[]} />',
  );
}

/**
 * A fila acima do campo.
 *
 * É o único snippet que mostra as duas peças juntas, porque é a única coisa que
 * a composição ensina: a fila é peça própria, e quem consome a empilha em cima
 * do campo. O campo não sabe que ela existe.
 */
export function queueAboveFieldSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="xs">',
    '  <MessageQueue',
    '    labels={queueLabels}',
    '    messages={waitingQueue}',
    '    onWithdraw={(message) => withdraw(message.id)}',
    '  />',
    '  <Composer labels={fieldLabels} />',
    '</div>',
  ].join('\n');

  return svelteSnippet(`${IMPORT}\n${IMPORT_FIELD}`, markup);
}
