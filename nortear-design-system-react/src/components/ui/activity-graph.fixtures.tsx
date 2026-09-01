/**
 * Andaime das demonstrações da grade de atividade.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase do total, os nomes dos meses e dos dias, e
 * a palavra de cada nível. A ATIVIDADE, a JANELA e a ESCALA saem de
 * `@shared/primitives/activity-graph-examples`, porque não são idioma: a
 * força de cada casa é a mesma nos três, e escrever contagens diferentes por
 * idioma faria as fotos mostrarem mapas diferentes.
 *
 * A JANELA MORA NO COMPARTILHADO POR UM MOTIVO A MAIS, e ele é o assunto da
 * peça: presa ao relógio, a fotografia mudaria sozinha todo dia, e comparar
 * duas stacks deixaria de ser possível.
 *
 * DOIS acessos ao mesmo dicionário, como em `trace-waterfall.fixtures.tsx`, e
 * a duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o
 * idioma corrente uma vez e serve à `play`, onde não há componente para
 * pendurar um hook. É também o que torna a asserção imune à troca de
 * idioma: a play compara com o rótulo que a tela está mostrando, e não com
 * uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import activityGraphTranslations from "@shared/content/activity-graph/translations.json"
import type { ActivityDay, RunStatus } from "@shared/primitives/chat-protocol"
import { ActivityGraph, type ActivityGraphLabels } from "./activity-graph"

/** Quantos níveis a escala do exemplo tem, contando o vazio. */
const LEVEL_WORDS = 5

type ActivityGraphContent = {
  labels: {
    region: string
    total: string
    dateFormat: string
    months: { short: Record<string, string>; long: Record<string, string> }
    weekdays: Record<string, string>
    none: string
    one: string
    many: string
    levels: Record<string, string>
    legendLess: string
    legendMore: string
  }
}

const CONTENT = activityGraphTranslations as unknown as Record<string, ActivityGraphContent>

const contentOf = (locale: Locale) => CONTENT[locale] ?? CONTENT["pt-BR"]

function read(locale: Locale): ActivityGraphLabels {
  const raw = contentOf(locale).labels
  return {
    region: raw.region,
    total: raw.total,
    dateFormat: raw.dateFormat,
    monthsShort: Array.from({ length: 12 }, (_, i) => raw.months.short[`m${i + 1}`]),
    monthsLong: Array.from({ length: 12 }, (_, i) => raw.months.long[`m${i + 1}`]),
    weekdaysShort: Array.from({ length: 7 }, (_, i) => raw.weekdays[`d${i}`]),
    none: raw.none,
    one: raw.one,
    many: raw.many,
    // Uma palavra a mais que os degraus: a do nível vazio.
    levels: Array.from({ length: LEVEL_WORDS }, (_, i) => raw.levels[`l${i}`]),
    legendLess: raw.legendLess,
    legendMore: raw.legendMore,
  }
}

/** Os moldes, os nomes de mês e de dia, e a palavra de cada nível. */
export function useActivityGraphLabels(): ActivityGraphLabels {
  const { locale } = useTranslation(activityGraphTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function activityGraphLabels(): ActivityGraphLabels {
  return read(useI18nStore.getState().locale)
}

/** A janela larga: um ano inteiro, que é o que faz a camada rolar. */
export const WIDE_START = "2025-04-01"
export const WIDE_END = "2026-03-31"

/**
 * Um dia de cada nível da escala, para a fotografia dos estados.
 *
 * A janela é de uma semana, e as contagens são escolhidas para cair uma em
 * cada degrau: é a única forma de fotografar a escala inteira lado a lado
 * sem depender de onde os picos do trimestre caíram.
 */
export const SCALE_START = "2026-03-01"
export const SCALE_END = "2026-03-07"

/**
 * As contagens que cobrem a escala inteira, uma por nível.
 *
 * Escritas contra os degraus do exemplo — nenhum número aqui é solto: cada
 * um é o menor que alcança o seu degrau, e é isso que faz esta grade mostrar
 * os cinco níveis e não quatro.
 */
export const SCALE_DAYS: readonly ActivityDay[] = [
  { date: "2026-03-01", count: 0 },
  { date: "2026-03-02", count: 1 },
  { date: "2026-03-03", count: 4 },
  { date: "2026-03-04", count: 8 },
  { date: "2026-03-05", count: 13 },
  { date: "2026-03-06", count: 0 },
  { date: "2026-03-07", count: 0 },
]

/**
 * O dia da grade da escala que alcança o degrau mais alto.
 *
 * Existe como constante, e não como cadeia escrita na story, porque a
 * asserção e o dado que a produz não podem divergir: escrito à mão, o
 * seletor já apontou para um valor inexistente depois de uma varredura de
 * renomeação, e a story passou a LANÇAR em vez de reprovar — defeito que
 * nenhum build alcança, porque mora dentro de uma string.
 */
export const SCALE_TOP_DATE = "2026-03-05"

/** O dia da mesma grade em que nada aconteceu, e serve de contraprova. */
export const SCALE_EMPTY_DATE = "2026-03-01"

/**
 * Um dia declarado FORA da janela.
 *
 * Ele não é erro: é quem passou o ano inteiro e pediu um trimestre. A story
 * afirma que ele não é desenhado e não entra no total.
 */
export const OUTSIDE_DAY: ActivityDay = { date: "2025-12-31", count: 99 }

export interface ActivityGraphHostProps {
  days: readonly ActivityDay[]
  start: string
  end: string
  thresholds: readonly number[]
  weekStart?: number
  status?: RunStatus
  /** Teto de largura, quando o assunto da story é a rolagem. */
  hostClassName?: string
  testid?: string
}

/**
 * O invólucro das demonstrações: um `div` com a grade dentro, quando há
 * grade.
 *
 * MORA AQUI, e não em cada arquivo de story, porque o componente devolve
 * `null` sem janela ou sem escala — e o invólucro é a única linha que os
 * três arquivos precisariam repetir. Duas cópias do mesmo nome com corpos
 * diferentes é o defeito que `fixture_duplicada_entre_stories` existe para
 * pegar: corrigir uma não corrige a outra.
 *
 * O invólucro também é o que permite afirmar que NADA foi desenhado — sem
 * ele, a story sem janela não teria elemento nenhum a que a asserção
 * pudesse apontar.
 */
export function ActivityGraphHost({
  days,
  start,
  end,
  thresholds,
  weekStart,
  status = "complete",
  hostClassName,
  testid,
}: ActivityGraphHostProps) {
  const labels = useActivityGraphLabels()

  return (
    <div className={hostClassName} data-testid={testid}>
      <ActivityGraph
        days={days}
        start={start}
        end={end}
        thresholds={thresholds}
        weekStart={weekStart}
        status={status}
        labels={labels}
      />
    </div>
  )
}
