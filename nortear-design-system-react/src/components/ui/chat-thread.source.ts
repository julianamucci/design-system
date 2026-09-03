/**
 * Transforms do painel Code do ChatThread.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * A LISTA DE MENSAGENS ENTRA RESUMIDA a três turnos, e nunca por extenso: uma
 * das stories tem trinta turnos e outra tem cinco linhas de markdown, e
 * despejá-las faria o painel ensinar o andaime em vez do componente. Resumida,
 * porém, e não ELIDIDA — a versão anterior citava `messages` e `labels` sem
 * nunca declará-los, e quem copiava recebia um símbolo indefinido na primeira
 * renderização.
 *
 * OS RÓTULOS ENTRAM POR INTEIRO, e não pelo padrão compartilhado. Existe um
 * `LABELS_CHAT_THREAD_DEFAULT` em `@shared/primitives/chat-thread-labels`, mas
 * ele não serve aqui: aquele objeto é o nome da REGIÃO que rola, que o
 * componente já usa como padrão de `regionLabel`. O que a prop `labels` exige é
 * outra coisa — "ir para o fim", "raciocínio", "fontes" e a palavra dos quatro
 * estados de ferramenta —, e é texto do produto, sem padrão escondido.
 */
import { jsxSnippet, attrsMultilinha, type SourceTransform } from '@/lib/story-source';

export type ChatThreadArgs = {
  messages: unknown;
  labels: unknown;
  error: string;
  size: string;
};

const IMPORT = 'import { ChatThread } from "@/components/ui/chat-thread";';

/**
 * Os rótulos falados, por INTEIRO.
 *
 * Não cabe resumir: `toolState` é `Record` completo de propósito — estado novo
 * no vocabulário compartilhado reprova a compilação aqui, em vez de anunciar
 * uma chamada de ferramenta sem palavra nenhuma. `{count}` é molde, e vira o
 * número de mensagens não lidas.
 */
const LABELS_BLOCK = [
  'const labels = {',
  '  jumpToEnd: "Ir para o fim · {count}",',
  '  reasoning: "Raciocínio",',
  '  sources: "Fontes",',
  '  toolState: {',
  '    pending: "aguardando",',
  '    running: "chamando",',
  '    done: "pronto",',
  '    failed: "falhou",',
  '  },',
  '};',
].join('\n');

/**
 * A conversa, resumida a três turnos e declarada com o nome do ramo.
 *
 * `id` entra em todos: é ele que mantém a mensagem no lugar enquanto ela cresce
 * durante o streaming, e sem ele a lista se remonta a cada troca.
 */
function messagesBlock(name: string): string {
  return [
    '// A conversa do exemplo tem trinta turnos — aqui, os três primeiros.',
    `const ${name} = [`,
    '  { id: "m1", role: "user", content: "Qual foi a variação de custo do trimestre?" },',
    '  { id: "m2", role: "assistant", content: "Subiu 8% sobre o trimestre anterior." },',
    '  { id: "m3", role: "user", content: "Separe o que subiu por preço do que subiu por volume." },',
    '];',
  ].join('\n');
}

/** `<ChatThread … />`, com o que a story de fato passa. */
function tag(partes: Array<string | undefined>): string {
  return `<ChatThread messages={messages} labels={labels}${attrsMultilinha(partes)} />`;
}

/** O import, a conversa e os rótulos. */
function preamble(extra: string[] = []): string {
  return [IMPORT, '', messagesBlock('messages'), '', LABELS_BLOCK, ...extra].join('\n');
}

function build(partes: Array<string | undefined> = [], extra: string[] = []): string {
  return jsxSnippet(preamble(extra), tag(partes));
}

/** Transform do `meta` — a forma básica. */
export const chatThreadSource: SourceTransform<ChatThreadArgs> = () => build([`size="md"`]);

/**
 * A conversa em movimento.
 *
 * Nesta stack a LISTA é a API: quem faz streaming troca o array, e o `id`
 * mantém a mensagem no lugar enquanto ela cresce. A lista declarada acima vira
 * a SEMENTE do estado, que é o que a diferencia do caso parado.
 */
export function chatThreadStreamingSource(): string {
  return jsxSnippet(
    [
      IMPORT,
      'import { useState } from "react";',
      '',
      messagesBlock('inicial'),
      '',
      LABELS_BLOCK,
      '',
      'const [messages, setMessages] = useState(inicial);',
      '',
      'const patch = (id, campos) =>',
      '  setMessages((atual) => atual.map((m) => (m.id === id ? { ...m, ...campos } : m)));',
    ].join('\n'),
    tag([`size="md"`]),
  );
}

/** Com erro de execução — a resposta que não vem. */
export function chatThreadErrorSource(): string {
  return build(
    [`error={erro}`, `size="md"`],
    [
      '',
      '// Falha da EXECUÇÃO, e não de uma ferramenta: é o que a peça anuncia',
      '// como alerta abaixo da conversa.',
      'const erro = "A resposta não chegou. Tente de novo.";',
    ],
  );
}

/** Conversa longa, onde a ancoragem no fim tem o que ancorar. */
export function chatThreadLongSource(): string {
  return build([`size="md"`]);
}
