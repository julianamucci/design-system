/**
 * Andaime das demonstrações da citação — um construtor, cinco arquivos.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`; o texto citado sai de
 * `@shared/primitives/chat-examples`, que é a MESMA conversa que a thread
 * desenha. É o que faz a citação e o turno citado dizerem a mesma coisa nas
 * cinco stacks — e é justamente o laço entre as duas peças.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import quoteTranslations from '@shared/content/composer-quote/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ComposerQuote, ComposerQuoteLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComposerQuoteLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Sem o
 * prefixo, a descrição do campo começaria com um nome solto.
 */
const CONTENT: Record<Locale, { labels: ComposerQuoteLabels }> = quoteTranslations;

/** Os rótulos da citação num idioma — a forma para quem já tem o locale em mãos. */
export function quoteLabelsFor(target: Locale): ComposerQuoteLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da citação fora de um componente — `props` de story e `play` não
 * são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a citação desenha.
 */
export function quoteLabels(): ComposerQuoteLabels {
  return quoteLabelsFor(get(locale));
}

/** O turno da conversa que a citação aponta — o primeiro do exemplo. */
const QUOTED = CHAT_CONVERSA[0]!;

/** Uma citação curta: cabe nas duas linhas que a folha reserva. */
export function shortQuote(): ComposerQuote {
  return {
    id: 'm-0',
    author: QUOTED.author ?? 'Você',
    role: QUOTED.role,
    excerpt: QUOTED.content,
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
