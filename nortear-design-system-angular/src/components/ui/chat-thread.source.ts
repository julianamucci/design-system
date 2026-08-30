/**
 * Transforms do painel Code do ChatThread.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo — e, nas
 * stories que mudam a conversa, para os botões do andaime. O que se copia tem
 * de ser o uso REAL: um componente que declara a lista e a passa adiante.
 *
 * A lista de mensagens NÃO entra no snippet. Ela tem trinta turnos numa das
 * stories e cinco linhas de Markdown noutra: despejá-la faria o painel ensinar
 * o andaime, e não o componente. O snippet declara a constante e mostra o que
 * se faz com ela.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsChatThread } from '@/components/ui/chat-thread';";

/** O corpo do `@Component`, com os atributos que a story de fato passa. */
function build(attrs: string[], body: string[]): string {
  return [
    IMPORT,
    '',
    '@Component({',
    '  imports: [NdsChatThread],',
    '  template: `',
    '    <nds-chat-thread',
    '      [messages]="messages"',
    '      [labels]="labels"',
    ...attrs,
    '    />',
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** Transform do `meta` — a forma básica. */
export function chatThreadSource(): string {
  return build(['      size="md"'], [
    '  readonly messages = signal<ChatMessage[]>(initial);',
    '  readonly labels = chatLabels();',
  ]);
}

/**
 * A conversa em movimento.
 *
 * Nesta stack a LISTA é a API: quem faz streaming troca o array, e o `id`
 * mantém a mensagem no lugar enquanto ela cresce — é ele que o `@for` usa como
 * `track`.
 */
export function chatThreadStreamingSource(): string {
  return build(['      size="md"'], [
    '  readonly messages = signal<ChatMessage[]>(initial);',
    '  readonly labels = chatLabels();',
    '',
    '  patch(id: string, fields: Partial<ChatMessage>) {',
    '    this.messages.update((list) =>',
    '      list.map((m) => (m.id === id ? { ...m, ...fields } : m)));',
    '  }',
  ]);
}

/** Com erro de execução — a resposta que não vem. */
export function chatThreadErrorSource(): string {
  return build(['      [error]="failure()"', '      size="md"'], [
    '  readonly messages = signal<ChatMessage[]>(initial);',
    '  readonly labels = chatLabels();',
    '  readonly failure = signal<string | undefined>(undefined);',
  ]);
}

/** Conversa longa, onde a ancoragem no fim tem o que ancorar. */
export function chatThreadLongSource(): string {
  return build(['      size="md"'], [
    '  readonly messages = signal<ChatMessage[]>(history);',
    '  readonly labels = chatLabels();',
  ]);
}
