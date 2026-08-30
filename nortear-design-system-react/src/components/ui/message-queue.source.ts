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
  return jsxSnippet(
    IMPORT,
    `<MessageQueue${attrsMultilinha([
      'labels={queueLabels}',
      `messages={${messages}}`,
      // Fila em que nada mais espera não oferece retirar coisa alguma, então o
      // retorno não teria como disparar: mostrá-lo ali ensinaria a ligar um fio
      // solto.
      opts.state === 'sending' ? undefined : 'onWithdraw={(message) => withdraw(message.id)}',
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
  return jsxSnippet(IMPORT, '<MessageQueue labels={queueLabels} messages={[]} />');
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
    `${IMPORT_COMPOSER}\n${IMPORT}`,
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
