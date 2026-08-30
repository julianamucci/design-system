/**
 * Transforms do painel Code da fila de envio.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, guarda as
 * mensagens que esperam e faz alguma coisa com o pedido de retirada.
 *
 * O Playground é o único que escreve a MENSAGEM por extenso, e é de propósito:
 * lá os controls mudam o estado e o texto, e um snippet que só mostrasse o nome
 * de um sinal mentiria sobre o que a story renderiza. Nas demais a fila é dado
 * de andaime — três falas de exemplo —, e despejá-la faria o painel ensinar o
 * andaime em vez da peça.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT_QUEUE =
  "import { NdsMessageQueue } from '@/components/ui/message-queue';";
const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type QueueSnippetOptions = {
  /** Nome do sinal da fila que o snippet declara. */
  messages?: string;
  /** Em que ponto está a mensagem que o Playground desenha. */
  state?: string;
  /** O texto da mensagem do Playground. */
  text?: string;
  /** O snippet escreve a mensagem por extenso, em vez de uma fila vazia? */
  literal?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[], imports: string[]): string {
  const used = imports.length > 1 ? 'NdsMessageQueue, NdsComposer' : 'NdsMessageQueue';
  return [
    ...imports,
    '',
    '@Component({',
    `  imports: [${used}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** Texto de fala dentro de aspas simples, com o que quebraria a aspa escapado. */
function quoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** A mensagem por extenso, na ordem em que o tipo a declara. */
function messageLiteral(options: QueueSnippetOptions): string {
  const fields = [
    `id: 'm1'`,
    `text: ${quoted(options.text ?? 'E o prazo?')}`,
    `state: ${quoted(options.state ?? 'waiting')}`,
  ];
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

/**
 * As linhas do retorno, que só existem onde ele pode disparar.
 *
 * Fila em que nada mais espera não oferece retirar coisa alguma, então a saída
 * não teria como sair: mostrá-la ali ensinaria a ligar um fio solto.
 */
function withdrawHandler(signalName: string): string[] {
  return [
    '',
    '  // Retirar de verdade é daqui. O componente só avisa que alguém pediu —',
    '  // quem envia é quem sabe se a mensagem ainda dá para segurar.',
    '  onWithdraw(message: QueuedMessage): void {',
    `    this.${signalName}.update((current) => current.filter((m) => m !== message));`,
    '  }',
  ];
}

function queueSnippet(options: QueueSnippetOptions = {}): string {
  const signalName = options.messages ?? 'queue';
  // Uma fila só com a que já está indo não oferece retirar nada.
  const emits = options.state !== 'sending';
  const seed = options.literal ? messageLiteral(options) : '[]';

  const inner = [
    '    <nds-message-queue',
    '      [labels]="labels"',
    `      [messages]="${signalName}()"`,
    ...(emits ? ['      (withdraw)="onWithdraw($event)"'] : []),
    '    />',
  ];

  const body = [
    '  readonly labels = queueLabels();',
    '',
    '  // A fila é de quem envia: o componente desenha o que recebe, e não',
    '  // envia, não retira e não reordena nada.',
    `  readonly ${signalName} = signal<QueuedMessage[]>(${seed});`,
    ...(emits ? withdrawHandler(signalName) : []),
  ];

  return build(inner, body, [IMPORT_QUEUE]);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type QueueSourceTransform = (
  code?: string,
  ctx?: { args?: QueueSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve a mensagem por extenso.
 *
 * Os args vêm dos controls: o estado e o texto da mensagem.
 */
export const messageQueueSource: QueueSourceTransform = (_code, ctx) =>
  queueSnippet({ ...(ctx?.args ?? {}), literal: true });

/**
 * Transforms de story: uma função NOMEADA por configuração.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolveria FUNÇÃO, e a guarda transversal
 * (`source-snippets.test.ts`) chama todo export sem argumento esperando string
 * — curried, as checagens que LEEM o snippet nunca chegariam ao snippet.
 */

/** Três esperando a vez: todas se retiram. */
export function queueWaitingSource(): string {
  return queueSnippet({ messages: 'waitingQueue' });
}

/** A primeira já está indo, e as outras duas esperam. */
export function queueSendingSource(): string {
  return queueSnippet({ messages: 'sendingQueue' });
}

/** Uma fila que passa de nove, onde a posição ganha dois dígitos. */
export function queueLongSource(): string {
  return queueSnippet({ messages: 'longQueue' });
}

/**
 * A fila VAZIA.
 *
 * Sem mensagem a lista não existe, e o snippet mostra o uso mínimo: nenhuma
 * saída ligada, porque não há botão de retirar para disparar. Uma lista vazia
 * seria anunciada como "lista com zero itens", que promete algo que não há.
 */
export function queueEmptySource(): string {
  const inner = [
    '    <nds-message-queue [labels]="labels" [messages]="queue()" />',
  ];

  const body = [
    '  readonly labels = queueLabels();',
    '',
    '  // Sem mensagem esperando, a lista não chega ao documento.',
    '  readonly queue = signal<QueuedMessage[]>([]);',
  ];

  return build(inner, body, [IMPORT_QUEUE]);
}

/**
 * A fila acima do campo.
 *
 * É o único snippet que mostra as duas peças juntas, porque é a única coisa que
 * a composição ensina: a fila é peça própria, e quem consome a empilha em cima
 * do campo. O campo não sabe que ela existe.
 */
export function queueAboveFieldSource(): string {
  const inner = [
    '    <nds-message-queue',
    '      [labels]="queueText"',
    '      [messages]="waitingQueue()"',
    '      (withdraw)="onWithdraw($event)"',
    '    />',
    '',
    '    <nds-composer [labels]="labels" />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly queueText = queueLabels();',
    '',
    '  // O campo não sabe que a fila existe: quem consome empilha as duas,',
    '  // nesta ordem — primeiro o que já saiu, depois onde se escreve.',
    '  readonly waitingQueue = signal<QueuedMessage[]>([]);',
    ...withdrawHandler('waitingQueue'),
  ];

  return build(inner, body, [IMPORT_QUEUE, IMPORT_COMPOSER]);
}
