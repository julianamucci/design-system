/**
 * Andaime das demonstrações do tempo da resposta.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: traduzi-los faria
 * as stories fotografarem medições diferentes conforme o idioma da foto. Mesmo
 * arranjo das quatro peças de medição irmãs.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER OS NÚMEROS. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem mede, e é quem mede que conhece o idioma. Um formatador de duração mora
 * nesta camada em qualquer produto de verdade; o que não pode é morar dentro do
 * componente, onde decidiria idioma em cinco stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma medição sai
 * `1,24 s` ou `1.24 sec`, e o separador decimal troca com quem lê. Nenhuma
 * heurística de componente acerta os três.
 *
 * E POR QUE NÃO HÁ CONTA NENHUMA AQUI, nem em `token-budget.ts`: velocidade é
 * token dividido por segundo, e a divisão já foi feita por quem cronometrou. O
 * andaime recebe as quatro medidas prontas e só as ESCREVE — não há limiar para
 * comparar, não há fração para tirar e não há arredondamento a decidir, porque
 * quantas casas cada número mostra é do formatador do idioma.
 *
 * DOIS acessos ao mesmo dicionário, como em `cost-meter.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o texto que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import messageTimingTranslations from "@shared/content/message-timing/translations.json"
import type { MessageTimingLabels, MessageTimingStat } from "./message-timing"

type TimingContent = {
  labels: {
    title: string
    measuring: string
    speedUnit: string
    stats: {
      firstToken: string
      total: string
      speed: string
      chunks: string
    }
  }
}

const CONTENT = messageTimingTranslations as unknown as Record<string, TimingContent>

/** O bloco de rótulos do idioma pedido, com o português como rede. */
function content(locale: Locale): TimingContent["labels"] {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** As duas unidades de tempo que estas medições usam. */
type DurationUnit = "millisecond" | "second"

/**
 * Uma duração escrita, no idioma corrente.
 *
 * Lê a loja A CADA CHAMADA, e não uma vez no topo do módulo: a docs page se
 * redesenha quando o idioma muda, e um formatador guardado no topo continuaria
 * escrevendo no idioma em que a página abriu. Serve às duas pontas — quem a
 * chama dentro de um componente já subscreveu o idioma por
 * `useMessageTimingLabels`, e quem a chama na `play` quer justamente a leitura
 * de agora.
 *
 * A UNIDADE VEM DE QUEM MEDIU, e não de um limiar daqui. Seria fácil escrever
 * "abaixo de um segundo mostre milissegundos", e seria uma regra a mais para
 * cinco stacks discordarem sobre — quem cronometrou já sabe em que unidade a
 * medida faz sentido, e é ela que passa. Quantas casas cada número mostra é do
 * formatador do idioma, e não de um arredondamento escrito à mão.
 */
export function durationText(value: number, unit: DurationUnit): string {
  return new Intl.NumberFormat(useI18nStore.getState().locale, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Uma taxa escrita, no idioma corrente.
 *
 * O NÚMERO é do formatador; a UNIDADE vem dos rótulos, porque token por segundo
 * não é uma das unidades que o navegador conhece e a abreviatura é interface.
 * É a mesma divisão que a peça do custo faz entre a quantia e a palavra que a
 * liga ao teto.
 */
export function speedText(value: number): string {
  const locale = useI18nStore.getState().locale
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
  return `${number} ${content(locale).speedUnit}`
}

/** Uma contagem escrita, no idioma corrente — separador de milhar incluído. */
export function countText(value: number): string {
  return new Intl.NumberFormat(useI18nStore.getState().locale).format(value)
}

/** O nome da medição, e a palavra que diz que ela ainda não acabou. */
function read(locale: Locale): MessageTimingLabels {
  const raw = content(locale)
  return { title: raw.title, measuring: raw.measuring }
}

/** Os rótulos da linha, no idioma corrente. Para dentro de um componente. */
export function useMessageTimingLabels(): MessageTimingLabels {
  const { locale } = useTranslation(messageTimingTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function messageTimingLabels(): MessageTimingLabels {
  return read(useI18nStore.getState().locale)
}

/** Os casos que a peça desenha diferente. */
export type MessageTimingCase = "settled" | "measuring" | "partial" | "none"

/**
 * As quatro medidas do exemplo, em número puro.
 *
 * Guardadas SEM formato para que a foto troque de idioma junto com a página: se
 * as cadeias estivessem aqui prontas, a demonstração escreveria em português
 * dentro de uma página em espanhol e ninguém repararia.
 */
const MEASURE = {
  firstToken: 420,
  total: 1.24,
  speed: 38.4,
  chunks: 42,
  /** O total enquanto a resposta ainda corre — menor que o final, de propósito. */
  totalSoFar: 0.86,
  /** Os pedaços já recebidos enquanto a resposta ainda corre. */
  chunksSoFar: 28,
} as const

/**
 * As medições de cada caso, na ordem em que quem mediu as produziu.
 *
 * A ORDEM É A MESMA NOS QUATRO, e isso é o assunto de uma das stories: a peça
 * não reordena nada, e é essa estabilidade que permite comparar a linha de uma
 * resposta com a da seguinte sem reler os termos.
 *
 * Os casos são escolhidos para cair EXATAMENTE onde a peça decide algo: um
 * conhece as quatro medidas, um ainda está medindo e não conhece a velocidade,
 * um conhece só duas, e um não conhece nenhuma. Exemplo que evita a borda é
 * exemplo que nunca mostra a regra.
 */
export function statsOf(name: MessageTimingCase): MessageTimingStat[] {
  const stats = content(useI18nStore.getState().locale).stats

  const firstToken = {
    label: stats.firstToken,
    value: durationText(MEASURE.firstToken, "millisecond"),
  }

  if (name === "none") return []

  if (name === "partial") {
    return [
      firstToken,
      { label: stats.total, value: durationText(MEASURE.total, "second") },
    ]
  }

  if (name === "measuring") {
    return [
      firstToken,
      { label: stats.total, value: durationText(MEASURE.totalSoFar, "second") },
      { label: stats.chunks, value: countText(MEASURE.chunksSoFar) },
    ]
  }

  return [
    firstToken,
    { label: stats.total, value: durationText(MEASURE.total, "second") },
    { label: stats.speed, value: speedText(MEASURE.speed) },
    { label: stats.chunks, value: countText(MEASURE.chunks) },
  ]
}

/** A medição daquele caso ainda está andando? */
export function isMeasuring(name: MessageTimingCase): boolean {
  return name === "measuring"
}

/**
 * O gatilho da forma compacta, montado por QUEM CONSOME.
 *
 * Ele nasce aqui e não dentro da peça porque a forma compacta da fonte é uma
 * COMPOSIÇÃO — um controle de verdade com uma dica de ferramenta —, e a peça
 * não ganha camada flutuante nem a política de foco que vem com ela (decisão 8
 * da folha). O rótulo é o número que resume a medição, e ele chega escrito como
 * todos os outros.
 */
export function messageTimingTriggerLabel(): string {
  return durationText(MEASURE.total, "second")
}
