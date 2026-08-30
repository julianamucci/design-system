/**
 * Transforms do painel Code do ChatThread.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * A lista de mensagens NÃO entra no snippet. Ela tem trinta turnos numa das
 * stories e cinco linhas de markdown noutra: despejá-la faria o painel ensinar
 * o andaime, e não o componente. O snippet declara a constante e mostra o que
 * se faz com ela.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ChatThreadArgs = {
  messages: unknown;
  labels: unknown;
  error: string;
  size: string;
};

const IMPORT = `import { ChatThread } from '@/components/ui/chat-thread';`;

/** `<ChatThread … />`, com o que a story de fato passa. */
function tag(parts: Array<string | undefined>): string {
  return `<ChatThread :messages="messages" :labels="labels"${attrsMultilinha(parts)} />`;
}

function build(parts: Array<string | undefined> = [], extra = ''): string {
  return vueSnippet(`${IMPORT}${extra}`, tag(parts));
}

/** Transform do `meta` — a forma básica. */
export const chatThreadSource: SourceTransform<ChatThreadArgs> = () => build([`size="md"`]);

/**
 * A conversa em movimento.
 *
 * Nesta stack a LISTA é a API: quem faz streaming muda o array, e o `id` mantém
 * a mensagem no lugar enquanto ela cresce.
 */
export function chatThreadStreamingSource(): string {
  return vueSnippet(
    `${IMPORT}

const messages = ref(inicial);

const patch = (id, campos) => {
  const alvo = messages.value.find((m) => m.id === id);
  if (alvo) Object.assign(alvo, campos);
};`,
    tag([`size="md"`]),
  );
}

/** Com erro de execução — a resposta que não vem. */
export function chatThreadErrorSource(): string {
  return build([`:error="erro"`, `size="md"`]);
}

/** Conversa longa, onde a ancoragem no fim tem o que ancorar. */
export function chatThreadLongSource(): string {
  return build([`size="md"`]);
}
