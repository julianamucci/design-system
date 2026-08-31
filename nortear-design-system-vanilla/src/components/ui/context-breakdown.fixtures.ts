/**
 * Andaime das demonstrações da repartição do contexto.
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
 */

import { createTranslation } from '@/lib/i18n';
import breakdownTranslations from '@shared/content/context-breakdown/translations.json';
import {
  CONTEXT_PART_IDS,
  CONTEXT_PARTS_EMPTY,
  CONTEXT_PARTS_SINGLE,
  CONTEXT_PARTS_SLIVER,
  CONTEXT_PARTS_TYPICAL,
} from '@shared/primitives/context-breakdown-examples';
import type { ContextPart } from '@shared/primitives/token-budget';
import type { ContextBreakdownLabels } from './context-breakdown';

const { t } = createTranslation(breakdownTranslations as Record<string, unknown>);

/**
 * O que está sendo repartido, a unidade contada, e a palavra de cada origem.
 *
 * O mapa de origens sai de `CONTEXT_PART_IDS`, e não de quatro linhas escritas
 * à mão: origem nova na lista compartilhada entra aqui sozinha, e a story que
 * percorre as parcelas passa a cobri-la sem que ninguém lembre do andaime.
 */
export function contextBreakdownLabels(): ContextBreakdownLabels {
  const parts: Record<string, string> = {};
  for (const id of CONTEXT_PART_IDS) parts[id] = t(`labels.parts.${id}`);

  return {
    title: t('labels.title'),
    unit: t('labels.unit'),
    parts,
  };
}

/**
 * Os mesmos rótulos, menos a palavra de uma origem.
 *
 * O caso "origem sem palavra" se produz TIRANDO um rótulo, e nunca inventando
 * uma parcela: o que muda é o que se sabe dizer sobre a repartição, e não a
 * repartição. Inventar uma quinta origem só para esta story faria a foto do
 * caso divergir da foto de todas as outras.
 */
export function contextBreakdownLabelsWithout(id: string): ContextBreakdownLabels {
  const labels = contextBreakdownLabels();
  const parts = { ...labels.parts };
  delete parts[id];
  return { ...labels, parts };
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
