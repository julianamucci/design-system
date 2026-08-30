/**
 * Transforms do painel Code do ChatThread.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * A lista de mensagens NÃO entra no snippet. Ela tem trinta turnos numa das
 * stories e cinco linhas de markdown noutra: despejá-la faria o painel ensinar
 * o andaime, e não o componente. O snippet declara a constante e mostra o que
 * se faz com ela.
 */
import { jsxSnippet, attrsMultilinha, type SourceTransform } from '@/lib/story-source';

export type ChatThreadArgs = {
  messages: unknown;
  labels: unknown;
  error: string;
  size: string;
};

const IMPORT = 'import { ChatThread } from "@/components/ui/chat-thread";';

/** `<ChatThread … />`, com o que a story de fato passa. */
function tag(partes: Array<string | undefined>): string {
  return `<ChatThread messages={messages} labels={labels}${attrsMultilinha(partes)} />`;
}

function build(partes: Array<string | undefined> = [], antes = ''): string {
  return jsxSnippet(`${IMPORT}${antes}`, tag(partes));
}

/** Transform do `meta` — a forma básica. */
export const chatThreadSource: SourceTransform<ChatThreadArgs> = () => build([`size="md"`]);

/**
 * A conversa em movimento.
 *
 * Nesta stack a LISTA é a API: quem faz streaming troca o array, e o `id`
 * mantém a mensagem no lugar enquanto ela cresce.
 */
export function chatThreadStreamingSource(): string {
  return jsxSnippet(
    `${IMPORT}

const [messages, setMessages] = useState(inicial);

const patch = (id, campos) =>
  setMessages((atual) => atual.map((m) => (m.id === id ? { ...m, ...campos } : m)));`,
    tag([`size="md"`]),
  );
}

/** Com erro de execução — a resposta que não vem. */
export function chatThreadErrorSource(): string {
  return build([`error={erro}`, `size="md"`]);
}

/** Conversa longa, onde a ancoragem no fim tem o que ancorar. */
export function chatThreadLongSource(): string {
  return build([`size="md"`]);
}
