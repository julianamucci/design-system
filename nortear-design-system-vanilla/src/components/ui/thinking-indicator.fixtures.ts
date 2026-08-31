/**
 * Andaime das demonstrações do indicador de geração — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface e têm
 * três idiomas. A FALA — a pergunta e a resposta — sai de
 * `@shared/primitives/chat-examples`, que as cinco stacks já compartilham: se
 * cada uma escrevesse a própria conversa, as cinco stories deixariam de
 * fotografar a mesma tela e a divergência só apareceria no Chromatic.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */

import { createTranslation } from '@/lib/i18n';
import indicatorTranslations from '@shared/content/thinking-indicator/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ChatMessageOptions } from './chat-thread';
import { paraMensagens } from './chat-thread.fixtures';

const { t } = createTranslation(indicatorTranslations as Record<string, unknown>);

/** A frase padrão da espera. É ela que chega a quem ouve a tela. */
export function generatingLabel(): string {
  return t('labels.generating');
}

/**
 * Outra frase para a mesma espera.
 *
 * Existe porque o Playground precisa mostrar que a frase é do consumidor: o
 * componente desenha os mesmos três pontos e diz o que lhe mandarem dizer.
 */
export function searchingLabel(): string {
  return t('labels.searching');
}

/** O rótulo do controle que faz o texto chegar, na composição da troca. */
export function revealLabel(): string {
  return t('labels.reveal');
}

/** A pergunta, em Markdown. */
export function questionText(): string {
  return CHAT_CONVERSA[0]!.content;
}

/** A resposta, em Markdown — a mesma que a conversa de exemplo já traz. */
export function answerText(): string {
  return CHAT_CONVERSA[1]!.content;
}

/**
 * A conversa com a pergunta feita e nada respondido ainda.
 *
 * É o estado exato em que o indicador existe: há o que responder, e a resposta
 * ainda não começou a vir.
 */
export function askedMessages(): ChatMessageOptions[] {
  return paraMensagens([CHAT_CONVERSA[0]!]);
}
