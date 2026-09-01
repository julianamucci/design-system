import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import { traceWaterfallLabels, TraceWaterfallHost } from "./trace-waterfall.fixtures"
import { traceWaterfallSource } from "./trace-waterfall.source"
import { RUN_STATUSES, type RunStatus } from "@shared/primitives/chat-protocol"
import { resolveTraceWaterfall } from "@shared/primitives/trace-waterfall-axis"
import {
  TRACE_SPANS_ORDER,
  TRACE_TOTAL_MS,
} from "@shared/primitives/trace-waterfall-examples"
import { TraceWaterfallDocs } from "@/components/docs/TraceWaterfallDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/**
 * Os três eixos da peça, numa peça só.
 *
 * O estado decide se ela se declara ocupada; quantos trechos entram decide o
 * quanto do rastro aparece; e o EIXO decide onde cada barra cai — é ele que
 * as barras dividem, e é a única coisa que muda a posição de todas ao mesmo
 * tempo.
 *
 * O EIXO É CONTROLE DE PROPÓSITO, e é o que esta story existe para mostrar:
 * encolhê-lo não reescala nada, ele RECORTA — as barras guardam o instante
 * em que começam, e o que passa do fim some. Uma peça que derivasse o eixo
 * dos trechos não teria este controle, porque não teria a decisão.
 */
type PlaygroundArgs = {
  status: RunStatus
  revealed: number
  totalMs: number
}

const meta: Meta<PlaygroundArgs> = {
  title: "Primitives/Conversational/TraceWaterfall",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(TraceWaterfallDocs),
      source: { transform: traceWaterfallSource },
    },
  },
  argTypes: {
    status: {
      control: "select",
      options: [...RUN_STATUSES],
      description:
        "Em que pé está a execução que escreve o rastro. Decide se a peça se declara ocupada.",
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(" | ") },
        defaultValue: { summary: "'idle'" },
      },
    },
    revealed: {
      control: { type: "range", min: 0, max: TRACE_SPANS_ORDER.length, step: 1 },
      description:
        "Quantos trechos entram. Revelar aos poucos é passar menos trechos com o mesmo eixo: as barras que sobram guardam a posição verdadeira, e sem trecho nenhum não há cascata.",
      table: { type: { summary: "number" }, defaultValue: { summary: "6" } },
    },
    totalMs: {
      control: { type: "range", min: 400, max: 2400, step: 100 },
      description:
        "O eixo que as barras dividem. Ele não é derivado dos trechos: encolhê-lo recorta as barras nas pontas em vez de reescalá-las.",
      table: { type: { summary: "number" }, defaultValue: { summary: "1200" } },
    },
  },
  args: {
    status: "running",
    revealed: TRACE_SPANS_ORDER.length,
    totalMs: TRACE_TOTAL_MS,
  },
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item4", "functional.item5", "functional.item6",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item4", "accessibility.item5", "accessibility.item6",
      "accessibility.item7",
      "visual.item1",
    ],
  },
  // O invólucro mora nas peças de andaime deste componente: sem trecho a peça
  // devolve `null`, e é ele que dá à asserção um elemento a que apontar.
  render: (args) => (
    <TraceWaterfallHost
      spans={TRACE_SPANS_ORDER.slice(0, args.revealed)}
      totalMs={args.totalMs}
      status={args.status}
      testid="trace-waterfall-host"
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const host = canvasElement.querySelector<HTMLElement>(
      '[data-testid="trace-waterfall-host"]',
    )!
    const labels = traceWaterfallLabels()

    if (args.revealed === 0) {
      // Sem trecho não há cascata, e a peça devolve nada — nem moldura, nem
      // camada que rola. Uma parada de teclado que leva a uma caixa vazia é
      // ruído com nome, e por isso a peça prefere não existir.
      await step("Sem trecho nenhum, nada é desenhado", async () => {
        await expect(host.children.length).toBe(0)
      })
      return
    }

    const root = host.querySelector<HTMLElement>('[data-slot="trace-waterfall"]')!
    const visible = TRACE_SPANS_ORDER.slice(0, args.revealed)
    // A CONTA DE REFERÊNCIA sai do primitivo compartilhado, e não de números
    // escritos aqui: se a asserção repetisse a conta, as duas erravam juntas.
    const drawing = resolveTraceWaterfall(visible, args.totalMs)!

    await step("Há uma linha por trecho, na ordem em que foram declarados", async () => {
      // A posição no eixo é livre; a ordem no DOM não é, porque ela é a
      // ordem de leitura (WCAG 1.3.2). E a peça não ordena por começo.
      const rows = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-row"]'),
      ]
      await expect(rows.length).toBe(visible.length)
      await expect(rows.map((r) => r.dataset.spanId)).toEqual(visible.map((s) => s.id))
      await expect(rows.map((r) => r.dataset.state)).toEqual(visible.map((s) => s.state))
    })

    await step("Cada barra cai na fração do eixo que o dado manda", async () => {
      // O valor COMPUTADO, e nunca o atributo: propriedade personalizada
      // declarada dentro do próprio seletor vence a herança, e ler o `style`
      // provaria só que alguém escreveu alguma coisa ali.
      const bars = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-bar"]'),
      ]
      await expect(bars.length).toBe(drawing.rows.length)
      for (const [index, bar] of bars.entries()) {
        const computed = getComputedStyle(bar)
        const start = Number(
          computed.getPropertyValue("--trace-waterfall-bar-start").trim(),
        )
        const size = Number(computed.getPropertyValue("--trace-waterfall-bar-size").trim())
        await expect(start).toBeCloseTo(drawing.rows[index].start, 3)
        await expect(size).toBeCloseTo(drawing.rows[index].size, 3)
        // E a barra nunca passa do fim do eixo: encolher a régua recorta,
        // não reescala.
        await expect(start + size).toBeLessThanOrEqual(100)
      }
    })

    await step("A régua é dita em palavras, e diz o eixo declarado", async () => {
      // Sem ela, "todas as barras contra o mesmo eixo" é uma afirmação que só
      // quem escreveu o dado consegue conferir.
      const axis = root.querySelector<HTMLElement>('[data-slot="trace-waterfall-axis"]')!
      await expect(axis.textContent).toBe(
        labels.axis.replace("{total}", String(args.totalMs)),
      )
    })

    await step("Cada linha diz o estado, o começo e a duração em palavras", async () => {
      // É a leitura da cascata, e é o que chega a quem não vê a barra: a
      // sobreposição entre dois trechos é dedutível dos números.
      const rows = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-row"]'),
      ]
      for (const [index, row] of rows.entries()) {
        const declared = visible[index]
        const reading = row.querySelector<HTMLElement>(
          '[data-slot="trace-waterfall-row-reading"]',
        )!
        await expect(reading.classList.contains("nds-sr-only")).toBe(true)
        await expect(reading.textContent).toContain(labels.state[declared.state])
        await expect(reading.textContent).toContain(String(declared.startMs))
        await expect(reading.textContent).toContain(String(declared.durationMs))
      }
    })

    await step("A camada que rola tem papel, nome e parada de teclado", async () => {
      // O par completo: `tabIndex` sem papel deixaria uma parada anônima, e
      // `aria-label` sobre um elemento sem papel é descartado pelo
      // navegador.
      const viewport = root.querySelector<HTMLElement>(
        '[data-slot="trace-waterfall-viewport"]',
      )!
      await expect(viewport.getAttribute("role")).toBe("group")
      await expect(viewport.getAttribute("aria-label")).toBe(labels.region)
      await expect(viewport.tabIndex).toBe(0)
      // E é a ÚNICA parada: uma linha não faz nada, e uma dúzia de paradas
      // que não levam a lugar nenhum é ruído para quem usa teclado.
      await expect(root.querySelectorAll("[tabindex]").length).toBe(1)
    })

    await step("A régua de cada linha fica fora do que é lido em voz", async () => {
      const tracks = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-track"]'),
      ]
      await expect(tracks.length).toBe(visible.length)
      for (const track of tracks) {
        await expect(track.getAttribute("aria-hidden")).toBe("true")
      }
    })

    await step("Os trechos são uma lista ordenada", async () => {
      const list = root.querySelector<HTMLElement>('[data-slot="trace-waterfall-rows"]')!
      await expect(list.tagName).toBe("OL")
    })

    await step("A peça se declara ocupada só enquanto a execução corre", async () => {
      // Nada aqui é região viva: um rastro ganha trecho mais depressa do que
      // se lê, e narrar cada trecho é a mesma armadilha do relógio ao vivo.
      await expect(root.getAttribute("aria-busy")).toBe(
        args.status === "running" ? "true" : null,
      )
      const liveRegions = root.querySelectorAll(
        '[role="status"], [role="alert"], [role="log"], [aria-live]',
      )
      await expect([...liveRegions]).toEqual([])
    })
  },
}
