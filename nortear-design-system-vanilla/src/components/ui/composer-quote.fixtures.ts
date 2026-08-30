/**
 * Andaime das demonstrações da citação — um construtor, cinco arquivos.
 *
 * Os RÓTULOS saem da `translations.json`; o texto citado sai de
 * `@shared/primitives/chat-examples`, que é a MESMA conversa que a thread
 * desenha. É o que faz a citação e o turno citado dizerem a mesma coisa nas
 * cinco stacks — e é justamente o laço entre as duas peças.
 */

import { createTranslation } from '@/lib/i18n';
import quoteTranslations from '@shared/content/composer-quote/translations.json';
import composerTranslations from '@shared/content/composer/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ComposerLabels } from './composer';
import type { ComposerQuote, ComposerQuoteLabels } from './composer-quote';

const { t } = createTranslation(quoteTranslations as Record<string, unknown>);
const { t: tComposer } = createTranslation(composerTranslations as Record<string, unknown>);

/** Os rótulos do campo, para a citação ter onde morar. */
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

/** Os rótulos da citação. */
export function quoteLabels(): ComposerQuoteLabels {
  return { dismiss: t('labels.dismiss'), describes: t('labels.describes') };
}

/** O turno da conversa que a citação aponta — o primeiro do exemplo. */
const CITADO = CHAT_CONVERSA[0]!;

/** Uma citação curta: cabe nas duas linhas que a folha reserva. */
export function shortQuote(): ComposerQuote {
  return {
    id: 'm-0',
    author: CITADO.author ?? 'Você',
    role: CITADO.role,
    excerpt: CITADO.content,
  };
}

/**
 * Uma citação longa: passa das duas linhas, e é o caso que prova o corte.
 *
 * O texto é a resposta do exemplo compartilhado, que tem markdown e várias
 * linhas — escrever um texto longo à mão faria o comprimento depender de
 * quantas palavras eu digitei, e não do conteúdo que a thread de fato mostra.
 */
export function longQuote(): ComposerQuote {
  const answer = CHAT_CONVERSA[1]!;
  return {
    id: 'm-1',
    author: answer.author ?? 'Assistente',
    role: answer.role,
    excerpt: answer.content,
  };
}
