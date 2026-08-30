/**
 * Andaime das demonstrações da fila — um construtor por caso.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * TEXTO das mensagens é fala, e fica igual nos três idiomas: traduzi-lo faria
 * as cinco stories fotografarem filas de larguras diferentes conforme o idioma
 * da foto, e a fala não é o que a peça documenta (guideline 17 §3.3).
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import queueTranslations from '@shared/content/message-queue/translations.json';
import type { QueuedMessage } from '@shared/primitives/chat-protocol';
import type { ComposerLabels } from '@/components/ui/composer';
import { composerLabelsFor } from '@/components/ui/composer/composer.fixtures';
import type { MessageQueueLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `MessageQueueLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um estado
 * sem palavra deixaria a etiqueta desenhando e ninguém sabendo o que ela diz.
 */
const CONTENT: Record<Locale, { labels: MessageQueueLabels }> = queueTranslations;

/** Os rótulos da fila num idioma — a forma para quem já tem o locale em mãos. */
export function queueLabelsFor(target: Locale): MessageQueueLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da fila fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a fila desenha.
 */
export function queueLabels(): MessageQueueLabels {
  return queueLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da fila no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a fila no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useQueueLabels(): ComputedRef<MessageQueueLabels> {
  const { locale } = useTranslation(queueTranslations);
  return computed(() => queueLabelsFor(locale.value as Locale));
}

/**
 * Os rótulos do CAMPO, para a fila ter o que acompanhar logo abaixo.
 *
 * Delega ao andaime do campo em vez de reler a `translations.json` dele: dois
 * lugares lendo o mesmo conteúdo são duas cópias que começam a divergir sem
 * sinal nenhum. O nome fica sendo o mesmo das outras stacks, porque é por ele
 * que a composição acima do campo se monta em todas.
 */
export function composerLabels(): ComposerLabels {
  return composerLabelsFor(useI18nStore().locale);
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
