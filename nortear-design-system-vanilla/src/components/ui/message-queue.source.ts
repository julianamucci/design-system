// Snippet do painel Code da fila de envio — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve a MENSAGEM por extenso, e é de propósito:
// lá os controls mudam o estado e o texto, e um snippet que só mostrasse o nome
// de uma constante mentiria sobre o que a story renderiza. Nas demais a fila é
// dado de andaime — três falas de exemplo —, e despejá-la faria o painel
// ensinar o andaime em vez da peça.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type QueueSnippetOptions = {
  /** Em que ponto está a mensagem que o Playground desenha. */
  state?: string;
  /** O texto da mensagem do Playground. */
  text?: string;
};

/** A mensagem por extenso, na ordem em que o tipo a declara. */
function messageLiteral(opts: QueueSnippetOptions): string {
  const fields = [
    `id: ${text('m1')}`,
    `text: ${text(opts.text ?? 'E o prazo?')}`,
    `state: ${text(opts.state ?? 'waiting')}`,
  ];
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

function build(opts: QueueSnippetOptions, messages: string): string {
  const lines = options([
    ['labels', 'queueLabels'],
    ['messages', messages],
    // Fila em que nada mais espera não oferece retirar coisa alguma, então o
    // retorno não teria como disparar: mostrá-lo ali ensinaria a ligar um fio
    // solto.
    ['onWithdraw', opts.state === 'sending' ? undefined : '(message) => withdraw(message.id)'],
  ]);

  return snippet(
    importing('message-queue', 'createMessageQueue'),
    `const queue = ${callLine('createMessageQueue', lines)};`,
    appendLine('queue'),
  );
}

/** Transform do `meta` — o Playground, que escreve a mensagem por extenso. */
export const messageQueueSource: SourceTransform<QueueSnippetOptions> = (_c, ctx) => {
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
 * A fábrica devolve nada quando não há o que esperar, e o snippet mostra o
 * teste que quem consome faz: uma lista vazia seria anunciada como "lista com
 * zero itens", que promete algo que não há.
 */
export function queueEmptySource(): string {
  const call = callLine('createMessageQueue', options([
    ['labels', 'queueLabels'],
    ['messages', '[]'],
  ]));

  return snippet(
    importing('message-queue', 'createMessageQueue'),
    `const queue = ${call};\n\nif (queue) document.querySelector('#app')?.append(queue);`,
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
  const queue = callLine('createMessageQueue', options([
    ['labels', 'queueLabels'],
    ['messages', 'waitingQueue'],
    ['onWithdraw', '(message) => withdraw(message.id)'],
  ]));

  const composer = callLine('createComposer', options([['labels', 'labels']]));

  return snippet(
    importing('message-queue', 'createMessageQueue'),
    importing('composer', 'createComposer'),
    `const queue = ${queue};`,
    `const composer = ${composer};`,
    `document.querySelector('#app')?.append(queue, composer);`,
  );
}
