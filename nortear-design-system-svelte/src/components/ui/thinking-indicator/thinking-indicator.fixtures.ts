/**
 * Andaime das demonstrações do indicador de geração.
 *
 * Existe porque num `*.stories.ts` todo export nomeado vira story: o andaime
 * não pode morar lá, e a saída fácil — copiar a constante para cada arquivo —
 * produz cópias que divergem sem nenhum sinal.
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
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import indicatorTranslations from '@shared/content/thinking-indicator/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ChatMessage } from '@/components/ui/chat-thread';
import { toMessages } from '@/components/ui/chat-thread/chat-thread.fixtures';

/**
 * O vocabulário das DEMONSTRAÇÕES, e não o do componente.
 *
 * O indicador tem uma frase só, e ela é prop de quem o usa. O que está aqui são
 * as frases de exemplo: duas esperas diferentes — para mostrar que o desenho é
 * o mesmo e o que muda é o que se manda dizer — e o nome do controle que, na
 * composição da troca, ocupa o lugar do primeiro trecho de texto chegando.
 */
export interface ThinkingIndicatorExampleLabels {
  /** A frase padrão da espera. É ela que chega a quem ouve a tela. */
  generating: string;
  /** Outra frase para a mesma espera. */
  searching: string;
  /** O rótulo do controle que faz o texto chegar. */
  reveal: string;
}

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ThinkingIndicatorExampleLabels` em CADA idioma, então frase que sumir do
 * JSON — ou idioma que ficar para trás — reprova no type-check, e não na tela.
 */
const CONTENT: Record<Locale, { labels: ThinkingIndicatorExampleLabels }> =
  indicatorTranslations;

/** As frases de um idioma — a forma para quem já tem o locale em mãos. */
export function indicatorLabelsFor(target: Locale): ThinkingIndicatorExampleLabels {
  return CONTENT[target].labels;
}

/**
 * As frases fora de um componente — `props` de story e `play` não são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então a frase que
 * a play procura é sempre a que o indicador anuncia.
 */
export function indicatorLabels(): ThinkingIndicatorExampleLabels {
  return indicatorLabelsFor(get(locale));
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
export function askedMessages(): ChatMessage[] {
  return toMessages([CHAT_CONVERSA[0]!]);
}
