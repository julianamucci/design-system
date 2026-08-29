// Snippet do painel Code do ChatThread — ver `@/lib/story-source`.
//
// Sem isto o renderer html imprime o `outerHTML`: a conversa inteira já
// desenhada, com cada mensagem, cada colapsável e cada fonte. O que se escreve
// é uma chamada de fábrica com uma lista de mensagens — é isso que o painel
// mostra.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `ChatThreadOptions` e que o snippet precisa mostrar. */
export type ChatThreadSnippetOptions = {
  /** Nome da constante de mensagens que o snippet declara. */
  messages?: string;
  /** A story acrescenta mensagem depois de montar? */
  append?: boolean;
  class?: string;
};

const DEFAULT_MESSAGES = 'conversa';

/**
 * A lista de mensagens NÃO entra no snippet.
 *
 * Ela tem trinta turnos numa das stories e cinco linhas de markdown noutra:
 * despejá-la faria o painel ensinar o andaime, e não o componente. O snippet
 * declara a constante e mostra o que se faz com ela — que é onde estão as duas
 * decisões que importam, os rótulos e o `append`.
 */
export function chatThreadSnippet(opts: ChatThreadSnippetOptions = {}): string {
  const messages = opts.messages ?? DEFAULT_MESSAGES;

  const linhas = options([
    ['messages', messages],
    ['labels', 'rotulos'],
    ['class', opts.class ? `'${opts.class}'` : undefined],
  ]);

  return snippet(
    importing('chat-thread', 'createChatThread'),
    `const thread = ${chamada('createChatThread', linhas)};`,
    montar('thread'),
    // A ordem é o contrato: quem decide se a rolagem acompanha é o componente,
    // e ele só pode decidir se a mensagem entrar por aqui.
    opts.append
      ? `// A rolagem só acompanha o fim se já estava no fim.\nthread.append({ role: 'assistant', content: resposta });`
      : undefined,
  );
}

/** Transform do painel Code: lê os args da story e devolve a chamada. */
export const chatThreadSource: SourceTransform<ChatThreadSnippetOptions> = (_code, ctx) =>
  chatThreadSnippet(ctx?.args ?? {});

/** Transform de story que fixa opções por cima dos args do arquivo. */
export function chatThreadSourceWith(
  fixed: ChatThreadSnippetOptions,
): SourceTransform<ChatThreadSnippetOptions> {
  return (_gerado, ctx) => chatThreadSnippet({ ...ctx.args, ...fixed });
}
