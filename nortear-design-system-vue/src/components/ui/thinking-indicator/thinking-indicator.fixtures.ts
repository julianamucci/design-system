/**
 * Andaime das demonstrações do indicador de geração — um construtor por caso.
 *
 * Existe pelo mesmo motivo do `chat-thread.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
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
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import indicatorTranslations from '@shared/content/thinking-indicator/translations.json';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';
import type { ChatMessage } from '../chat-thread';
import { toMessages } from '../chat-thread/chat-thread.fixtures';

/**
 * As frases da espera, e o rótulo do controle que faz o texto chegar.
 *
 * NÃO é a API do componente: ele recebe uma string e nada mais. Isto é o texto
 * das demonstrações, e mora numa forma tipada porque a anotação abaixo é o
 * PORTÃO — a seção `labels` é lida em CADA idioma, então frase que sumir do
 * JSON, ou idioma que ficar para trás, reprova no type-check e não na tela.
 */
interface IndicatorLabels {
  /** A frase padrão da espera. É ela que chega a quem ouve a tela. */
  generating: string;
  /**
   * Outra frase para a mesma espera.
   *
   * Existe porque o Playground precisa mostrar que a frase é do consumidor: o
   * componente desenha os mesmos três pontos e diz o que lhe mandarem dizer.
   */
  searching: string;
  /** O rótulo do controle que faz o texto chegar, na composição da troca. */
  reveal: string;
}

const CONTENT: Record<Locale, { labels: IndicatorLabels }> = indicatorTranslations;

/**
 * As frases num idioma — a forma para quem já tem o locale em mãos.
 *
 * É a única que serve no ESCOPO DE MÓDULO, onde os `args` do `meta` são
 * escritos: ali a store de locale ainda não existe, porque o Pinia só é
 * instalado quando a aplicação da story é criada. Por isso o valor inicial do
 * control sai do idioma padrão da documentação, e não do idioma corrente — e
 * quem troca o idioma na barra troca também o que a lista de controles mostra.
 */
export function indicatorLabelsFor(target: Locale): IndicatorLabels {
  return CONTENT[target].labels;
}

/** O idioma padrão da documentação, para o valor inicial do control. */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

/**
 * As frases no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a espera no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useIndicatorLabels(): ComputedRef<IndicatorLabels> {
  const { locale } = useTranslation(indicatorTranslations);
  return computed(() => indicatorLabelsFor(locale.value as Locale));
}

/**
 * A frase da espera fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable acima, então a frase que a play
 * procura é sempre a que o indicador anunciou. A store existe fora do `setup`
 * porque o `preview` instala o Pinia na aplicação, e instalar é o que a torna
 * ativa para quem a pede de fora.
 *
 * É a ÚNICA das três com forma avulsa, e de propósito: as outras duas só são
 * desenhadas, nunca procuradas, e o composable já as entrega ao render. Um
 * getter exportado que nada renderiza é peso morto — e há portão que o vê.
 */
export function generatingLabel(): string {
  return indicatorLabelsFor(useI18nStore().locale).generating;
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
