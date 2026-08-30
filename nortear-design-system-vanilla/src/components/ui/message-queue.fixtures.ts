/**
 * Andaime das demonstrações da fila — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * TEXTO das mensagens é fala, e fica igual nos três idiomas: traduzi-lo faria
 * as cinco stories fotografarem filas de larguras diferentes conforme o idioma
 * da foto, e a fala não é o que a peça documenta.
 */

import { createTranslation } from '@/lib/i18n';
import queueTranslations from '@shared/content/message-queue/translations.json';
import composerTranslations from '@shared/content/composer/translations.json';
import type { QueuedMessage } from '@shared/primitives/chat-protocol';
import type { ComposerLabels } from './composer';
import type { MessageQueueLabels } from './message-queue';

const { t } = createTranslation(queueTranslations as Record<string, unknown>);
const { t: tComposer } = createTranslation(composerTranslations as Record<string, unknown>);

/** Os rótulos do campo, para a fila ter o que acompanhar logo abaixo. */
export function composerLabels(): ComposerLabels {
  return {
    input: tComposer('labels.input'),
    placeholder: tComposer('labels.placeholder'),
    submit: tComposer('labels.submit'),
    stop: tComposer('labels.stop'),
    hint: tComposer('labels.hint'),
    limit: tComposer('labels.limit'),
  };
}

/** Os rótulos da fila. */
export function queueLabels(): MessageQueueLabels {
  return {
    list: t('labels.list'),
    withdraw: t('labels.withdraw'),
    state: {
      waiting: t('labels.state.waiting'),
      sending: t('labels.state.sending'),
    },
  };
}

/**
 * As três falas de exemplo, em ordem de escrita.
 *
 * São dado, e por isso ficam fora da tradução. Três porque a fila só ensina
 * alguma coisa a partir do terceiro item: com dois, "a segunda" e "a última"
 * são a mesma coisa, e a posição deixa de ser informação.
 */
const SAMPLE_TEXTS = [
  'Manda o resumo de ontem',
  'E o prazo?',
  'Inclui o gráfico de custo',
];

/** O texto da mensagem que o Playground desenha. */
export const SAMPLE_TEXT = SAMPLE_TEXTS[1]!;

/** Três esperando a vez — nenhuma saiu ainda, e todas se retiram. */
export function waiting(): QueuedMessage[] {
  return SAMPLE_TEXTS.map((text, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text,
    state: 'waiting',
  }));
}

/**
 * A primeira já está indo, e as outras duas esperam.
 *
 * É o par que a peça existe para desenhar: uma sem botão de retirar e marcada
 * como ocupada, duas com o botão à mão.
 */
export function sending(): QueuedMessage[] {
  return SAMPLE_TEXTS.map((text, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text,
    state: i === 0 ? 'sending' : 'waiting',
  }));
}

/**
 * Uma fila que passa de nove.
 *
 * Doze porque é onde a posição ganha dois dígitos: é o único caso em que o
 * alinhamento dos números tem o que provar, e ele não aparece em fila curta.
 */
export function longQueue(): QueuedMessage[] {
  return Array.from({ length: 12 }, (_, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length]!,
    state: i === 0 ? 'sending' : 'waiting',
  }));
}
