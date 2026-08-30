/**
 * Andaime das demonstrações do ChatThread — um construtor, cinco arquivos.
 *
 * Os RÓTULOS saem da `translations.json`: são texto de interface, e texto de
 * interface tem três idiomas. As MENSAGENS saem de
 * `@shared/primitives/chat-examples`, que as cinco stacks compartilham — se
 * cada uma escrevesse a própria conversa, as cinco stories deixariam de
 * fotografar a mesma tela.
 */
import { computed, type ComputedRef } from 'vue';
import { useTranslation } from '@/lib/i18n';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import type { ChatExampleMessage } from '@shared/primitives/chat-examples';
import type { ChatMessage, ChatThreadLabels } from './index';

/**
 * Os rótulos da interface, no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a conversa no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useChatLabels(): ComputedRef<ChatThreadLabels> {
  const { t } = useTranslation(chatTranslations);
  return computed(() => ({
    jumpToEnd: t('labels.jumpToEnd'),
    reasoning: t('labels.reasoning'),
    sources: t('labels.sources'),
    toolState: {
      pending: t('labels.toolState.pending'),
      running: t('labels.toolState.running'),
      done: t('labels.toolState.done'),
      failed: t('labels.toolState.failed'),
    },
  }));
}

/**
 * Do exemplo compartilhado para o que o componente aceita.
 *
 * A conversão é explícita campo a campo: o exemplo é dado, e espalhá-lo com
 * `...` deixaria um campo novo dele entrar no componente sem ninguém decidir.
 */
export function toMessages(examples: ChatExampleMessage[]): ChatMessage[] {
  return examples.map((example, i) => ({
    id: `m-${i}`,
    role: example.role,
    content: example.content,
    author: example.author,
    time: example.time,
    reasoning: example.reasoning,
    toolCalls: example.toolCalls,
    sources: example.sources,
  }));
}
