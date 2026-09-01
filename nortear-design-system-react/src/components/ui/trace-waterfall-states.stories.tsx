import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import {
  traceWaterfallLabels,
  TraceWaterfallHost,
  useTraceWaterfallLabels,
} from "./trace-waterfall.fixtures"
import {
  traceWaterfallEveryStateSource,
  traceWaterfallFailureSource,
  traceWaterfallRunningSource,
} from "./trace-waterfall.source"
import { TOOL_CALL_STATES, type TraceSpan } from "@shared/primitives/chat-protocol"
import {
  TRACE_SPANS_FAILURE,
  TRACE_SPANS_ORDER,
  TRACE_TOTAL_MS,
} from "@shared/primitives/trace-waterfall-examples"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O estado é do TRECHO, e não da peça — o que a peça tem é o estado da
// execução que a escreve, e ele decide uma coisa só: se ela se declara
// ocupada. Por isso esta régua fotografa os quatro estados de trecho um sob
// o outro, e não quatro cascatas.

const meta: Meta = {
  title: "Primitives/Conversational/TraceWaterfall/States",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: traceWaterfallEveryStateSource },
      description: {
        component:
          "Os quatro estados de trecho, com forma própria na marca e no preenchimento da barra, e a palavra que chega a quem não vê a forma. O estado da execução decide apenas se a peça se declara ocupada.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="trace-waterfall"]')

const rowsIn = (piece: HTMLElement) => [
  ...piece.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-row"]'),
]

/**
 * Um rastro com um trecho por estado.
 *
 * A lista sai de `TOOL_CALL_STATES`, e não de quatro trechos escritos à mão:
 * estado novo no vocabulário compartilhado entra nesta story sozinho, e
 * ninguém precisa lembrar de mexer aqui. O rótulo de cada trecho é a palavra
 * do próprio estado, e ela vem do hook — assim a régua se reescreve quando o
 * idioma muda.
 */
function EveryStateExample() {
  const labels = useTraceWaterfallLabels()
  const spans: TraceSpan[] = TOOL_CALL_STATES.map((state, index) => ({
    id: state,
    label: labels.state[state],
    startMs: index * 280,
    durationMs: 240,
    depth: 0,
    state,
  }))

  // A execução já terminou: é o par desta régua, e o que ela mostra é que a
  // peça deixa de se declarar ocupada sem apagar estado de trecho nenhum.
  return <TraceWaterfallHost spans={spans} totalMs={TRACE_TOTAL_MS} status="complete" />
}

/** Os quatro estados de trecho, na mesma régua. */
export const EveryState: Story = {
  parameters: {
    covers: ["functional.item7", "functional.item9", "visual.item2"],
    docs: { source: { transform: traceWaterfallEveryStateSource } },
  },
  render: () => <EveryStateExample />,
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!
    const labels = traceWaterfallLabels()

    await step("Há um trecho por estado, e cada um diz qual é o seu", async () => {
      const rows = rowsIn(piece)
      await expect(rows.length).toBe(TOOL_CALL_STATES.length)
      await expect(rows.map((r) => r.dataset.state)).toEqual([...TOOL_CALL_STATES])
    })

    await step("A palavra do estado chega a quem não vê a forma da marca", async () => {
      // Forma para quem vê — a marca ao lado do nome e o preenchimento da
      // barra —, palavra para quem ouve, e ninguém fica com a cor sozinha
      // (WCAG 1.4.1).
      for (const state of TOOL_CALL_STATES) {
        const row = piece.querySelector<HTMLElement>(
          `[data-slot="trace-waterfall-row"][data-span-id="${state}"]`,
        )!
        const reading = row.querySelector<HTMLElement>(
          '[data-slot="trace-waterfall-row-reading"]',
        )!
        await expect(reading.textContent).toContain(labels.state[state])
        // A marca é decorativa: ela é a leitura rápida para quem vê, e
        // repetir o estado em desenho não acrescenta nada a quem ouve.
        const marker = row.querySelector<HTMLElement>(
          '[data-slot="trace-waterfall-marker"]',
        )!
        await expect(marker.getAttribute("aria-hidden")).toBe("true")
      }
    })

    await step("A execução terminou, e a peça deixa de se declarar ocupada", async () => {
      await expect(piece.getAttribute("aria-busy")).toBeNull()
    })
  },
}

/** Um trecho que quebrou. */
export const Failure: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: { source: { transform: traceWaterfallFailureSource } },
  },
  render: () => (
    <TraceWaterfallHost spans={TRACE_SPANS_FAILURE} totalMs={TRACE_TOTAL_MS} status="failed" />
  ),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!

    await step("O trecho que quebrou desenha diferente do que terminou", async () => {
      // É o par que resolve a regra da cor: a barra troca de cor e a MARCA
      // troca de forma, então o estado nunca depende só da cor.
      //
      // OS IDS SAEM DA FIXTURE, e não escritos aqui: literal dentro de
      // string não é alcançado por portão nenhum, e um seletor que deixa de
      // casar faz a story LANÇAR em vez de reprovar.
      const declaredBroken = TRACE_SPANS_FAILURE.filter((s) => s.state === "failed")
      const declaredDone = TRACE_SPANS_FAILURE.filter((s) => s.state === "done")
      const broken = [
        ...piece.querySelectorAll<HTMLElement>(
          '[data-slot="trace-waterfall-row"][data-state="failed"]',
        ),
      ]
      await expect(broken.map((r) => r.dataset.spanId)).toEqual(
        declaredBroken.map((s) => s.id),
      )
      await expect(piece.querySelectorAll('[data-state="done"]').length).toBe(
        declaredDone.length,
      )
    })

    await step("A execução que falhou não se declara ocupada", async () => {
      await expect(piece.getAttribute("aria-busy")).toBeNull()
    })
  },
}

/** Em andamento, com a execução ocupada. */
export const Running: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: traceWaterfallRunningSource } },
  },
  render: () => (
    <TraceWaterfallHost spans={TRACE_SPANS_ORDER} totalMs={TRACE_TOTAL_MS} status="running" />
  ),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!

    await step("Enquanto corre, a peça se declara ocupada", async () => {
      // `aria-busy` é o que substitui a região viva nesta família: ele diz
      // que aquele pedaço da tela ainda se escreve, sem anunciar nada.
      await expect(piece.getAttribute("aria-busy")).toBe("true")
      await expect(piece.querySelectorAll("[aria-live]").length).toBe(0)
    })

    await step("O rastro inteiro desenha as seis linhas e as seis barras", async () => {
      await expect(rowsIn(piece).length).toBe(TRACE_SPANS_ORDER.length)
      await expect(
        piece.querySelectorAll('[data-slot="trace-waterfall-bar"]').length,
      ).toBe(TRACE_SPANS_ORDER.length)
    })
  },
}

/**
 * Sem trecho, ou sem eixo: a peça prefere não existir.
 *
 * Devolver uma moldura vazia seria pior que devolver nada — a camada que
 * rola é parada de teclado, e uma parada que leva a uma caixa vazia é ruído
 * com nome. E são DOIS casos, porque um eixo sem extensão não posiciona
 * nada: o rastro existe e não há régua para dividir.
 */
export const Empty: Story = {
  parameters: {
    covers: ["functional.item8"],
    docs: { source: { transform: traceWaterfallEveryStateSource } },
  },
  render: () => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      <TraceWaterfallHost
        spans={[]}
        totalMs={TRACE_TOTAL_MS}
        status="idle"
        testid="trace-waterfall-empty-host"
      />
      <TraceWaterfallHost
        spans={TRACE_SPANS_ORDER}
        totalMs={0}
        status="idle"
        testid="trace-waterfall-no-axis-host"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Sem trecho não há cascata, e nada é desenhado", async () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-testid="trace-waterfall-empty-host"]',
      )!
      await expect(host.children.length).toBe(0)
    })

    await step("Sem eixo com extensão também não há cascata", async () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-testid="trace-waterfall-no-axis-host"]',
      )!
      await expect(host.children.length).toBe(0)
      await expect(pieceOf(canvasElement)).toBeNull()
    })
  },
}
