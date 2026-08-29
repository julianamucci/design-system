/**
 * Andaime das demonstrações do ChatThread — um construtor, cinco arquivos.
 *
 * Existe pelo mesmo motivo do `editor.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída fácil
 * — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, e não de literais: eles são texto de
 * interface, e texto de interface tem três idiomas. As MENSAGENS saem de
 * `@shared/primitives/chat-examples`, que as cinco stacks compartilham.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */

import { createTranslation } from '@/lib/i18n';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import type { ChatExampleMessage } from '@shared/primitives/chat-examples';
import type { ChatMessageOptions, ChatThreadLabels } from './chat-thread';

const { t } = createTranslation(chatTranslations as Record<string, unknown>);

/** Os rótulos da interface, no idioma corrente. */
export function chatLabels(): ChatThreadLabels {
  return {
    jumpToEnd: t('labels.jumpToEnd'),
    reasoning: t('labels.reasoning'),
    sources: t('labels.sources'),
    toolState: {
      running: t('labels.toolState.running'),
      done: t('labels.toolState.done'),
      failed: t('labels.toolState.failed'),
    },
  };
}

/**
 * Do exemplo compartilhado para o que a fábrica aceita.
 *
 * A conversão é explícita campo a campo: o exemplo é dado, e espalhá-lo com
 * `...` deixaria um campo novo dele entrar na fábrica sem ninguém decidir.
 */
export function paraMensagens(exemplos: ChatExampleMessage[]): ChatMessageOptions[] {
  return exemplos.map((m) => ({
    role: m.role,
    content: m.content,
    author: m.author,
    time: m.time,
    reasoning: m.reasoning,
    toolCalls: m.toolCalls,
    sources: m.sources,
  }));
}
