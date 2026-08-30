/**
 * Andaime das demonstrações da citação — um construtor, cinco arquivos.
 *
 * Os RÓTULOS saem da `translations.json`; o texto citado sai de
 * `@shared/primitives/chat-examples`, que é a MESMA conversa que a thread
 * desenha. É o que faz a citação e o turno citado dizerem a mesma coisa nas
 * cinco stacks — e é justamente o laço entre as duas peças.
 *
 * O rótulo do CAMPO não se repete aqui: `composerLabels` já mora em
 * `composer.fixtures.ts`, e a citação vive dentro do campo. Copiar o construtor
 * produziria duas cópias que divergem sem nenhum sinal — quem precisa dele
 * importa de lá.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import quoteTranslations from '@shared/content/composer-quote/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ComposerQuote, ComposerQuoteLabels } from './composer-quote';

const { t } = useTranslation(quoteTranslations as Record<string, unknown>);

/** Os rótulos da citação, no idioma corrente. */
export function quoteLabels(): ComposerQuoteLabels {
  return { dismiss: t('labels.dismiss'), describes: t('labels.describes') };
}

/** O turno da conversa que a citação aponta — o primeiro do exemplo. */
const CITADO = CHAT_CONVERSA[0];

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
  const answer = CHAT_CONVERSA[1];
  return {
    id: 'm-1',
    author: answer.author ?? 'Assistente',
    role: answer.role,
    excerpt: answer.content,
  };
}
