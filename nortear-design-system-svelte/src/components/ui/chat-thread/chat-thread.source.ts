/**
 * Transforms do painel Code do ChatThread.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * A lista de mensagens NÃO entra no snippet. Ela tem trinta turnos numa das
 * stories e cinco linhas de markdown noutra: despejá-la faria o painel ensinar
 * o andaime, e não o componente. O snippet declara a constante e mostra o que
 * se faz com ela.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type ChatThreadArgs = {
  messages: unknown;
  labels: unknown;
  error: string;
  size: string;
};

const IMPORT = "import { ChatThread } from '@/components/ui/chat-thread';";

/** `<ChatThread … />`, com o que a story de fato passa. */
function tag(parts: Array<string | undefined>): string {
  return `<ChatThread {messages} {labels}${attrsMultilinha(parts)} />`;
}

/**
 * As declarações do exemplo, escritas por extenso.
 *
 * NOME LIGADO É NOME DECLARADO. O bloco do painel é copiado inteiro, e a lista
 * e os rótulos moravam só no arquivo da story — quem colasse receberia
 * `messages` e `labels` sem nada por baixo. A conversa continua entrando por
 * NOME: o que passa a aparecer é a declaração, não as mensagens.
 */
const DECL_MESSAGES = [
  '// A conversa é de quem a monta: cada mensagem com o seu id, o autor e o',
  '// que ela traz.',
  'const messages = [/* as mensagens da conversa */];',
  'const labels = { /* os rótulos da conversa */ };',
].join('\n');

function build(parts: Array<string | undefined> = [], extra: string[] = []): string {
  return svelteSnippet([IMPORT, '', DECL_MESSAGES, ...extra].join('\n'), tag(parts));
}

/** Transform do `meta` — a forma básica. */
export function chatThreadSource(): string {
  return build(['size="md"']);
}

/**
 * A conversa em movimento.
 *
 * Nesta stack a LISTA é a API: quem faz streaming troca o array, e o `id`
 * mantém a mensagem no lugar enquanto ela cresce.
 */
export function chatThreadStreamingSource(): string {
  return svelteSnippet(
    `${IMPORT}

const labels = { /* os rótulos da conversa */ };
const initial = [/* as mensagens que já chegaram */];

let messages = $state(initial);

const patch = (id, fields) => {
  messages = messages.map((m) => (m.id === id ? { ...m, ...fields } : m));
};`,
    tag(['size="md"']),
  );
}

/** Com erro de execução — a resposta que não vem. */
export function chatThreadErrorSource(): string {
  return build(
    ['{error}', 'size="md"'],
    ['', "const error = 'A resposta não chegou. Tente de novo.';"],
  );
}

/** Conversa longa, onde a ancoragem no fim tem o que ancorar. */
export function chatThreadLongSource(): string {
  return build(['size="md"']);
}
