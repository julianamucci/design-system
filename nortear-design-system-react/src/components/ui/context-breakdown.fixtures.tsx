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
 *
 * DOIS acessos ao mesmo dicionário, como em `context-display.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import breakdownTranslations from "@shared/content/context-breakdown/translations.json"
import {
  CONTEXT_PART_IDS,
  CONTEXT_PARTS_EMPTY,
  CONTEXT_PARTS_SINGLE,
  CONTEXT_PARTS_SLIVER,
  CONTEXT_PARTS_TYPICAL,
} from "@shared/primitives/context-breakdown-examples"
import type { ContextPart } from "@shared/primitives/token-budget"
import type { ContextBreakdownLabels } from "./context-breakdown"

type BreakdownContent = {
  labels: {
    title: string
    unit: string
    parts: Record<string, string>
  }
}

const CONTENT = breakdownTranslations as unknown as Record<string, BreakdownContent>

/**
 * O que está sendo repartido, a unidade contada, e a palavra de cada origem.
 *
 * O mapa de origens sai de `CONTEXT_PART_IDS`, e não de quatro linhas escritas
 * à mão: origem nova na lista compartilhada entra aqui sozinha, e a story que
 * percorre as parcelas passa a cobri-la sem que ninguém lembre do andaime.
 */
function read(locale: Locale): ContextBreakdownLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const parts: Record<string, string> = {}
  for (const id of CONTEXT_PART_IDS) parts[id] = raw.parts[id] ?? ""

  return { title: raw.title, unit: raw.unit, parts }
}

/**
 * Os mesmos rótulos, menos a palavra de uma origem.
 *
 * O caso "origem sem palavra" se produz TIRANDO um rótulo, e nunca inventando
 * uma parcela: o que muda é o que se sabe dizer sobre a repartição, e não a
 * repartição. Inventar uma quinta origem só para esta story faria a foto do
 * caso divergir da foto de todas as outras.
 */
function without(labels: ContextBreakdownLabels, id: string): ContextBreakdownLabels {
  const parts = { ...labels.parts }
  delete parts[id]
  return { ...labels, parts }
}

/** Os rótulos da repartição, no idioma corrente. Para dentro de um componente. */
export function useContextBreakdownLabels(): ContextBreakdownLabels {
  const { locale } = useTranslation(breakdownTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function contextBreakdownLabels(): ContextBreakdownLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * Os rótulos sem a palavra daquela origem. Para dentro de um componente.
 *
 * Só a forma de hook, e não o par hook + função pura das outras: a `play` do
 * caso sem palavra não compara com este mapa — ela compara com o ENDEREÇO, que
 * é literal, e com os rótulos inteiros das demais linhas. Exportar a função
 * pura seria exportar o que nada renderiza.
 */
export function useContextBreakdownLabelsWithout(id: string): ContextBreakdownLabels {
  const labels = useContextBreakdownLabels()
  return useMemo(() => without(labels, id), [labels, id])
}

/** Os casos que a peça desenha diferente. */
export type ContextBreakdownCase = "typical" | "sliver" | "single" | "empty"

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
}

/** A repartição daquele caso. */
export function partsOf(name: ContextBreakdownCase): ContextPart[] {
  return CONTEXT_BREAKDOWN_PARTS[name]
}
