/**
 * Transforms do painel Code da fila de envio.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QueueArgs = {
  /** Em que ponto está a mensagem que o Playground desenha. */
  state?: string;
  /** O texto da mensagem do Playground. */
  text?: string;
};

/** O que muda de uma tag para a outra, sem passar pelos controls. */
type TagOptions = {
  /** Nome da constante dos rótulos. Duas peças na mesma tela pedem dois nomes. */
  labelsName?: string;
  /** O snippet mostra o ouvinte de retirada? */
  withdraw?: boolean;
};

const IMPORT = "import { MessageQueue } from '@/components/ui/message-queue';";

const IMPORT_ABOVE_FIELD =
  "import { Composer } from '@/components/ui/composer';\n" +
  "import { MessageQueue } from '@/components/ui/message-queue';";

/** O aviso de retirada, escrito como quem consome o escuta. */
const ON_WITHDRAW = '@withdraw="(message) => withdraw(message.id)"';

/** A mensagem por extenso, na ordem em que o tipo a declara. */
function messageLiteral(opts: QueueArgs): string {
  const fields = [
    `id: '${text('m1')}'`,
    `text: '${text(opts.text, 'E o prazo?')}'`,
    `state: '${text(opts.state, 'waiting')}'`,
  ];
  return `const queue = [\n  { ${fields.join(', ')} },\n];`;
}

/**
 * A tag da fila, só com o que a configuração ensina.
 *
 * Fila em que nada mais espera não oferece retirar coisa alguma, então o
 * ouvinte não teria como disparar: mostrá-lo ali ensinaria a ligar um fio
 * solto.
 */
function queueTag(messages: string, opts: TagOptions = {}): string {
  const attrs = attrsMultilinha([
    `:labels="${opts.labelsName ?? 'labels'}"`,
    `:messages="${messages}"`,
    opts.withdraw === false ? undefined : ON_WITHDRAW,
  ]);
  return `<MessageQueue${attrs} />`;
}

/** Transform do `meta` — o Playground, que escreve a mensagem por extenso. */
export const messageQueueSource: SourceTransform<QueueArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const tag = queueTag('queue', { withdraw: args.state !== 'sending' });
  return vueSnippet(`${IMPORT}\n\n${messageLiteral(args)}`, tag);
};

/** Três esperando a vez: todas se retiram. */
export function queueWaitingSource(): string {
  return vueSnippet(IMPORT, queueTag('waitingQueue'));
}

/** A primeira já está indo, e as outras duas esperam. */
export function queueSendingSource(): string {
  return vueSnippet(IMPORT, queueTag('sendingQueue'));
}

/** Uma fila que passa de nove, onde a posição ganha dois dígitos. */
export function queueLongSource(): string {
  return vueSnippet(IMPORT, queueTag('longQueue'));
}

/**
 * A fila VAZIA.
 *
 * A peça não desenha nada quando não há o que esperar, e o snippet mostra
 * justamente isso: quem consome passa a lista como ela está, sem envolver a
 * fila num teste próprio. Uma lista vazia seria anunciada como "lista com zero
 * itens", que promete algo que não há — e sem item não há o que retirar, então
 * o ouvinte também sai.
 */
export function queueEmptySource(): string {
  return vueSnippet(
    IMPORT,
    `<!-- Sem mensagem, a fila não desenha nada. -->\n${queueTag('[]', { withdraw: false })}`,
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
  const queue = queueTag('waitingQueue', { labelsName: 'queueLabels' });
  const stack = `${queue}\n<Composer :labels="labels" />`;

  return vueSnippet(
    IMPORT_ABOVE_FIELD,
    `<div class="nds-stack" data-spacing="xs">\n${indentar(stack)}\n</div>`,
  );
}
