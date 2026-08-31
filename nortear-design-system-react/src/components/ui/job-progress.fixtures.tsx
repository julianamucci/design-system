/**
 * Andaime das demonstrações do andamento de trabalho longo.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — e os
 * moldes da conta junto com eles, porque a palavra que liga os dois números é
 * do idioma. Os NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: o
 * que muda por idioma é o separador de milhar, que a própria peça aplica, e não
 * a quantidade — números diferentes por foto fariam as cinco stories
 * fotografarem barras de comprimentos diferentes.
 *
 * DOIS acessos ao mesmo dicionário, como em `connection-state.fixtures.tsx`, e
 * a duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import jobTranslations from "@shared/content/job-progress/translations.json"
import { RUN_STATUSES, type JobCount, type RunStatus } from "@shared/primitives/chat-protocol"
import type { JobProgressLabels } from "./job-progress"

type JobContent = {
  labels: {
    job: string
    status: Record<string, string>
    count: string
    countWithoutTotal: string
    action?: Record<string, string>
  }
}

const CONTENT = jobTranslations as unknown as Record<string, JobContent>

const labelsOf = (locale: Locale) => (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

/**
 * A palavra de cada estado, os dois moldes da conta e o rótulo da ação onde ela
 * existe.
 *
 * O mapa de estados sai de `RUN_STATUSES`, e não de cinco linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
function read(locale: Locale): JobProgressLabels {
  const raw = labelsOf(locale)

  const status = {} as Record<RunStatus, string>
  for (const item of RUN_STATUSES) status[item] = raw.status[item] ?? ""

  const action: Partial<Record<RunStatus, string>> = {}
  // Em espera e concluído ficam sem ação de propósito: disparar o trabalho é de
  // quem o enfileirou, e sobre um trabalho pronto não há o que fazer aqui.
  for (const item of RUN_STATUSES) {
    const label = raw.action?.[item]
    if (label) action[item] = label
  }

  return {
    status,
    count: raw.count,
    countWithoutTotal: raw.countWithoutTotal,
    action,
  }
}

/** Os rótulos da peça, no idioma corrente. Para dentro de um componente. */
export function useJobProgressLabels(): JobProgressLabels {
  const { locale } = useTranslation(jobTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function jobProgressLabels(): JobProgressLabels {
  return read(useI18nStore.getState().locale)
}

/** O que está sendo feito nas demonstrações. Para dentro de um componente. */
export function useJobLabel(): string {
  const { locale } = useTranslation(jobTranslations)
  return useMemo(() => labelsOf(locale).job, [locale])
}

/** O mesmo rótulo, fora de React — é o que a `play` compara. */
export function jobLabel(): string {
  return labelsOf(useI18nStore.getState().locale).job
}

/**
 * A conta de exemplo, a mesma em toda foto.
 *
 * Uma só, com total conhecido, e é ela que as stories dos cinco estados
 * recebem de propósito: assim a diferença entre as fotos é o estado, e não o
 * número. O que a peça faz com a MESMA conta em cada estado é justamente o
 * assunto — concluído desenha cheio, parado congela, em andamento mostra a
 * fração.
 */
export const JOB_COUNT: JobCount = { done: 1240, total: 5000 }

/**
 * A conta sem total conhecido — o caso que a peça existe para não errar.
 *
 * Quem varre um repositório sabe quantos arquivos abriu, e não quantos vai
 * abrir. Mesmo número já feito da conta acima, para que a única diferença entre
 * as duas fotos seja a ausência do denominador.
 */
export const JOB_COUNT_WITHOUT_TOTAL: JobCount = { done: 1240 }
