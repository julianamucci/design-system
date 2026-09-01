/**
 * Andaime das demonstrações da cascata de trechos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase da régua, o molde da leitura e a palavra
 * de cada estado. Os TRECHOS e o EIXO saem de
 * `@shared/primitives/trace-waterfall-examples`, porque não são idioma: a
 * posição das barras é a mesma nos três, e escrever milissegundos diferentes
 * por idioma faria as fotos mostrarem cascatas diferentes.
 *
 * Diferente da tela do computador, aqui NADA do andaime é nó de React: a
 * cascata não tem espaço de quem consome, então tudo o que a demonstração
 * precisa é dado — e o único componente deste módulo existe para o `null`, e
 * não para o conteúdo.
 *
 * DOIS acessos ao mesmo dicionário, como em `flow-graph.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play
 * compara com o rótulo que a tela está mostrando, e não com uma palavra
 * escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import traceWaterfallTranslations from "@shared/content/trace-waterfall/translations.json"
import type {
  RunStatus,
  ToolCallState,
  TraceSpan,
} from "@shared/primitives/chat-protocol"
import { TraceWaterfall, type TraceWaterfallLabels } from "./trace-waterfall"

type TraceWaterfallContent = {
  labels: {
    region: string
    axis: string
    duration: string
    reading: string
    clipped: string
    state: Record<ToolCallState, string>
  }
}

const CONTENT = traceWaterfallTranslations as unknown as Record<string, TraceWaterfallContent>

const contentOf = (locale: Locale) => CONTENT[locale] ?? CONTENT["pt-BR"]

function read(locale: Locale): TraceWaterfallLabels {
  const raw = contentOf(locale).labels
  return {
    region: raw.region,
    axis: raw.axis,
    duration: raw.duration,
    reading: raw.reading,
    clipped: raw.clipped,
    state: {
      pending: raw.state.pending,
      running: raw.state.running,
      done: raw.state.done,
      failed: raw.state.failed,
    },
  }
}

/** O nome da camada, os quatro moldes e as quatro palavras. */
export function useTraceWaterfallLabels(): TraceWaterfallLabels {
  const { locale } = useTranslation(traceWaterfallTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function traceWaterfallLabels(): TraceWaterfallLabels {
  return read(useI18nStore.getState().locale)
}

/** O eixo do rastro largo. */
export const WIDE_TOTAL_MS = 4000

/**
 * Um rastro fundo, para o caso em que ele não cabe na conversa.
 *
 * Dez trechos, cada um um degrau mais fundo que o anterior até a metade e
 * voltando depois: é o recuo, e não o número de linhas, que faz a peça passar
 * da conversa — a coluna do nome cresce com o degrau, e a do eixo tem largura
 * mínima própria. Gerado, e não escrito à mão, porque o que a story fotografa
 * é a rolagem.
 */
export function wideTraceSpans(): TraceSpan[] {
  return Array.from({ length: 10 }, (_, index): TraceSpan => ({
    id: `trecho-${index}`,
    label: `Etapa ${index + 1} do atendimento ao cliente`,
    startMs: index * 340,
    durationMs: 300,
    depth: index < 5 ? index : 9 - index,
    state: index < 4 ? "done" : index === 4 ? "running" : "pending",
  }))
}

/** O eixo do rastro de rótulos longos. */
export const LONG_LABEL_TOTAL_MS = 900

/**
 * Um rastro com rótulos longos.
 *
 * O rótulo do trecho não quebra e não é cortado: ele ALARGA a coluna, a peça
 * passa a ser mais larga que a conversa e a camada rola. É a divergência
 * deliberada em relação ao grafo, onde o rótulo quebra — lá a caixa está numa
 * casa de grade cuja largura é a do rótulo; aqui quebrar faria a linha
 * crescer em altura e desalinhar a régua da vizinha.
 */
export const LONG_LABEL_SPANS: readonly TraceSpan[] = [
  {
    id: "coleta",
    label: "Coletar os documentos que o cliente anexou ao pedido",
    startMs: 0,
    durationMs: 260,
    depth: 0,
    state: "done",
  },
  {
    id: "conferencia",
    label: "Conferir cada documento contra a lista de exigências do contrato",
    startMs: 270,
    durationMs: 380,
    depth: 1,
    state: "running",
  },
  {
    id: "resumo",
    label: "Escrever o resumo do que falta",
    startMs: 660,
    durationMs: 220,
    depth: 1,
    state: "pending",
  },
]

/** O eixo do rastro de rótulos curtos. */
export const SHORT_LABEL_TOTAL_MS = 600

/**
 * Um rastro de rótulos curtos.
 *
 * Existe para a story da customização, e a razão é mecânica: a coluna do
 * nome é `max-content` com um PISO, e o piso só decide a largura quando o
 * conteúdo é mais estreito que ele. Com rótulos longos, apertar o piso não
 * muda pixel nenhum — a story ficaria verde medindo uma coisa que não
 * aconteceu.
 */
export const SHORT_LABEL_SPANS: readonly TraceSpan[] = [
  { id: "ler", label: "Ler", startMs: 0, durationMs: 120, depth: 0, state: "done" },
  { id: "ver", label: "Ver", startMs: 140, durationMs: 200, depth: 1, state: "running" },
  { id: "dizer", label: "Dizer", startMs: 360, durationMs: 220, depth: 1, state: "pending" },
]

/** O eixo da janela que recorta — mais curto que o rastro que ela mostra. */
export const CLIPPED_TOTAL_MS = 600

/**
 * Um rastro que não cabe no eixo declarado.
 *
 * É a JANELA: quem mostra o meio de um rastro longo declara um eixo menor
 * que ele, e os trechos das pontas são recortados. Não é erro — é o desenho
 * de quem mostra um pedaço —, e a linha recortada avisa em palavras que o
 * trecho continua fora.
 */
export const CLIPPED_SPANS: readonly TraceSpan[] = [
  { id: "anterior", label: "Vinha de antes da janela", startMs: -400, durationMs: 700, depth: 0, state: "done" },
  { id: "dentro", label: "Cabe inteiro na janela", startMs: 200, durationMs: 150, depth: 1, state: "done" },
  { id: "seguinte", label: "Segue depois da janela", startMs: 420, durationMs: 900, depth: 1, state: "running" },
]

/**
 * O id do trecho que atravessa o fim da janela.
 *
 * Existe como constante, e não como cadeia escrita na story, porque a
 * asserção e o dado que a produz não podem divergir: escrito à mão, o
 * seletor já apontou para um id inexistente depois de uma varredura de
 * renomeação, e a story passou a LANÇAR em vez de reprovar — defeito que
 * nenhum build alcança, porque mora dentro de uma string.
 */
export const CLIPPED_SPAN_ID = "seguinte"

/** O id do trecho que cabe inteiro, e serve de contraprova ao recorte. */
export const UNCLIPPED_SPAN_ID = "dentro"

export interface TraceWaterfallHostProps {
  spans: readonly TraceSpan[]
  totalMs: number
  status?: RunStatus
  /** Teto de largura, quando o assunto da story é a rolagem. */
  hostClassName?: string
  testid?: string
}

/**
 * O invólucro das demonstrações: um `div` com a cascata dentro, quando há
 * cascata.
 *
 * MORA AQUI, e não em cada arquivo de story, porque o componente devolve
 * `null` sem trecho nenhum — e o invólucro é a única linha que os três
 * arquivos precisariam repetir. Duas cópias do mesmo nome com corpos
 * diferentes é o defeito que `fixture_duplicada_entre_stories` existe para
 * pegar: corrigir uma não corrige a outra.
 *
 * O invólucro também é o que permite afirmar que NADA foi desenhado — sem
 * ele, a story sem trecho não teria elemento nenhum a que a asserção
 * pudesse apontar.
 */
export function TraceWaterfallHost({
  spans,
  totalMs,
  status = "running",
  hostClassName,
  testid,
}: TraceWaterfallHostProps) {
  const labels = useTraceWaterfallLabels()

  return (
    <div className={hostClassName} data-testid={testid}>
      <TraceWaterfall spans={spans} totalMs={totalMs} status={status} labels={labels} />
    </div>
  )
}
