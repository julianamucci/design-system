/**
 * Andaime das demonstrações do ChatThread — um construtor, cinco arquivos.
 *
 * Num `*.stories.ts` todo export nomeado vira story, então o andaime não pode
 * morar lá, e a saída fácil — copiar a constante para cada arquivo — produz
 * cópias que divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`: são texto de interface, e texto de
 * interface tem três idiomas. As MENSAGENS saem de
 * `@shared/primitives/chat-examples`, que as cinco stacks compartilham — se
 * cada uma escrevesse a própria conversa, as cinco stories deixariam de
 * fotografar a mesma tela.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import type { ChatExampleMessage } from '@shared/primitives/chat-examples';
import type { ChatMessage, ChatThreadLabels } from './chat-thread';

const { t } = useTranslation(chatTranslations as Record<string, unknown>);

/** Os rótulos da interface, no idioma corrente. */
export function chatLabels(): ChatThreadLabels {
  return {
    jumpToEnd: t('labels.jumpToEnd'),
    reasoning: t('labels.reasoning'),
    sources: t('labels.sources'),
    toolState: {
      pending: t('labels.toolState.pending'),
      running: t('labels.toolState.running'),
      done: t('labels.toolState.done'),
      failed: t('labels.toolState.failed'),
    },
  };
}

/**
 * Do exemplo compartilhado para o que o componente aceita.
 *
 * A conversão é explícita campo a campo: o exemplo é dado, e espalhá-lo com
 * `...` deixaria um campo novo dele entrar no componente sem ninguém decidir.
 *
 * O `id` é atribuído AQUI porque nesta stack ele é o `track` do `@for`: sem
 * endereço, cada renderização remontaria a lista inteira.
 */
export function toMessages(examples: ChatExampleMessage[]): ChatMessage[] {
  return examples.map((m, i) => ({
    id: `m-${i}`,
    role: m.role,
    content: m.content,
    author: m.author,
    time: m.time,
    reasoning: m.reasoning,
    toolCalls: m.toolCalls,
    sources: m.sources,
  }));
}
