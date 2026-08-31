/**
 * Andaime das demonstrações da repartição do contexto.
 *
 * Existe pelo mesmo motivo do andaime da peça irmã: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída fácil
 * — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. As
 * REPARTIÇÕES saem de `@shared/primitives/context-breakdown-examples`, porque
 * são dado de exemplo e precisam ser as MESMAS nas cinco stacks: aqui a ordem
 * das parcelas decide a cor de cada fatia e a linha de cada legenda, e cinco
 * listas escritas à mão divergiriam na ordem antes de divergirem no número.
 *
 * O que este arquivo acrescenta é só o que depende de i18n e do tipo do
 * componente: o mapa de palavras por origem, e a variação dele que deixa uma
 * origem sem palavra.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import {
  CONTEXT_PARTS_EMPTY,
  CONTEXT_PARTS_SINGLE,
  CONTEXT_PARTS_SLIVER,
  CONTEXT_PARTS_TYPICAL,
} from '@shared/primitives/context-breakdown-examples';
import type { ContextPart } from '@shared/primitives/token-budget';
import breakdownTranslations from '@shared/content/context-breakdown/translations.json';
import type { ContextBreakdownLabels } from './ContextBreakdown.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ContextBreakdownLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 *
 * O mapa de origens vem da seção INTEIRA, e não de quatro linhas escritas à
 * mão: procedência nova na `translations.json` entra aqui sozinha, e a story
 * que percorre as parcelas passa a cobri-la sem que ninguém lembre do andaime.
 */
const CONTENT: Record<Locale, { labels: ContextBreakdownLabels }> = breakdownTranslations;

/** Os rótulos da repartição num idioma — a forma para quem já tem o locale. */
export function contextBreakdownLabelsFor(target: Locale): ContextBreakdownLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da repartição fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function contextBreakdownLabels(): ContextBreakdownLabels {
  return contextBreakdownLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da repartição no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useContextBreakdownLabels(): ComputedRef<ContextBreakdownLabels> {
  const { locale } = useTranslation(breakdownTranslations);
  return computed(() => contextBreakdownLabelsFor(locale.value as Locale));
}

/**
 * Os mesmos rótulos, menos a palavra de uma origem.
 *
 * O caso "origem sem palavra" se produz TIRANDO um rótulo, e nunca inventando
 * uma parcela: o que muda é o que se sabe dizer sobre a repartição, e não a
 * repartição. Inventar uma quinta origem só para esta story faria a foto
 * divergir da foto de todas as outras.
 */
export function withoutLabelFor(
  labels: ContextBreakdownLabels,
  id: string,
): ContextBreakdownLabels {
  const parts = { ...labels.parts };
  delete parts[id];
  return { ...labels, parts };
}

/** A variação sem uma palavra, fora de um componente — para a `play`. */
export function contextBreakdownLabelsWithout(id: string): ContextBreakdownLabels {
  return withoutLabelFor(contextBreakdownLabels(), id);
}

/** A variação sem uma palavra no idioma corrente — para o render. */
export function useContextBreakdownLabelsWithout(
  id: string,
): ComputedRef<ContextBreakdownLabels> {
  const labels = useContextBreakdownLabels();
  return computed(() => withoutLabelFor(labels.value, id));
}

/** Os casos que a peça desenha diferente. */
export type ContextBreakdownCase = 'typical' | 'sliver' | 'single' | 'empty';

/**
 * Uma repartição por caso, todas somando o mesmo, menos a vazia.
 *
 * Os três primeiros somam vinte e cinco mil de propósito — é o consumo do
 * exemplo de aviso da peça irmã, e é o que permite mostrar as duas lado a lado
 * sem parecer que medem coisas diferentes. O quarto soma zero, que é a conversa
 * que ainda não teve turno nenhum.
 */
export const CONTEXT_BREAKDOWN_PARTS: Record<ContextBreakdownCase, ContextPart[]> = {
  typical: CONTEXT_PARTS_TYPICAL,
  sliver: CONTEXT_PARTS_SLIVER,
  single: CONTEXT_PARTS_SINGLE,
  empty: CONTEXT_PARTS_EMPTY,
};

/** A repartição daquele caso. */
export function partsOf(name: ContextBreakdownCase): ContextPart[] {
  return CONTEXT_BREAKDOWN_PARTS[name];
}
