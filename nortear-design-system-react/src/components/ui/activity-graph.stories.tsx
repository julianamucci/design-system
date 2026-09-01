import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import { activityGraphLabels, ActivityGraphHost } from "./activity-graph.fixtures"
import { activityGraphSource } from "./activity-graph.source"
import { RUN_STATUSES, type RunStatus } from "@shared/primitives/chat-protocol"
import { resolveActivityCalendar } from "@shared/primitives/activity-calendar"
import {
  ACTIVITY_DAYS,
  ACTIVITY_END,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from "@shared/primitives/activity-graph-examples"
import { ActivityGraphDocs } from "@/components/docs/ActivityGraphDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/**
 * Os três eixos da peça, numa peça só.
 *
 * O estado decide se ela se declara ocupada; a presença de atividade decide
 * se a grade tem tinta — e não se ela existe, que é a diferença desta peça
 * em relação às irmãs da família; e o começo da semana gira as sete linhas.
 *
 * A JANELA NÃO É CONTROLE, e a ausência dela aqui é a decisão: ela é dado, e
 * trocá-la é remontar a peça com outra janela. O que os controles mostram é
 * o que muda SEM trocar o período — e, entre eles, o que a atividade vazia
 * mostra é justamente que a grade continua lá.
 */
type PlaygroundArgs = {
  status: RunStatus
  withActivity: boolean
  weekStart: number
}

const meta: Meta<PlaygroundArgs> = {
  title: "Primitives/Conversational/ActivityGraph",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ActivityGraphDocs),
      source: { transform: activityGraphSource },
    },
  },
  argTypes: {
    status: {
      control: "select",
      options: [...RUN_STATUSES],
      description:
        "Em que pé está a execução que escreve a grade. Decide se a peça se declara ocupada.",
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(" | ") },
        defaultValue: { summary: "'idle'" },
      },
    },
    withActivity: {
      control: "boolean",
      description:
        "Houve atividade na janela? Sem nenhuma, a grade continua desenhada com todas as casas apagadas: um período em que nada aconteceu é a resposta, e não a ausência dela.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    weekStart: {
      control: { type: "range", min: 0, max: 6, step: 1 },
      description:
        "Em que dia a semana começa, com zero no domingo. As sete linhas giram junto, e os rótulos de dia acompanham.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
  },
  args: {
    status: "complete",
    withActivity: true,
    weekStart: 0,
  },
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item5", "functional.item6",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item4", "accessibility.item5", "accessibility.item6",
      "accessibility.item7",
      "visual.item1",
    ],
  },
  // O invólucro mora nas fixtures: sem janela o componente devolve `null`, e
  // é ele que dá à asserção um elemento a que apontar.
  render: (args) => (
    <ActivityGraphHost
      days={args.withActivity ? ACTIVITY_DAYS : []}
      start={ACTIVITY_START}
      end={ACTIVITY_END}
      thresholds={ACTIVITY_THRESHOLDS}
      weekStart={args.weekStart}
      status={args.status}
      testid="activity-graph-host"
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const host = canvasElement.querySelector<HTMLElement>(
      '[data-testid="activity-graph-host"]',
    )!
    const root = host.querySelector<HTMLElement>('[data-slot="activity-graph"]')!
    const labels = activityGraphLabels()
    // A CONTA DE REFERÊNCIA sai do primitivo compartilhado, e não de números
    // escritos aqui: se a asserção repetisse a conta, as duas errariam
    // juntas.
    const drawing = resolveActivityCalendar(args.withActivity ? ACTIVITY_DAYS : [], {
      start: ACTIVITY_START,
      end: ACTIVITY_END,
      thresholds: ACTIVITY_THRESHOLDS,
      weekStart: args.weekStart,
    })!

    await step("Há uma casa por dia da janela, na ordem do calendário", async () => {
      // A posição na grade é para o olho; a ordem no DOM é a ordem de
      // leitura (WCAG 1.3.2), e ela é a do calendário — não coluna por
      // coluna.
      const cells = [...root.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]')]
      await expect(cells.length).toBe(drawing.cells.length)
      await expect(cells.map((c) => c.dataset.date)).toEqual(
        drawing.cells.map((c) => c.date),
      )
    })

    await step("O nível chega em atributo e em número, e os dois concordam", async () => {
      // O valor COMPUTADO, e nunca o atributo `style`: propriedade
      // personalizada declarada dentro do próprio seletor vence a herança, e
      // ler o `style` provaria só que alguém escreveu alguma coisa ali.
      const cells = [...root.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]')]
      for (const [index, cell] of cells.entries()) {
        const expected = drawing.cells[index].level
        await expect(cell.dataset.level).toBe(String(expected))
        const computed = Number(
          getComputedStyle(cell).getPropertyValue("--activity-graph-day-level").trim(),
        )
        await expect(computed).toBe(expected)
      }
    })

    await step("Cada casa diz a data, a contagem e a palavra do nível", async () => {
      // É a leitura da grade, e é o que chega a quem não vê a tinta. O dia
      // sem atividade tem frase própria, e não a frase de contagem com um
      // zero.
      const cells = [...root.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]')]
      for (const [index, cell] of cells.entries()) {
        const declared = drawing.cells[index]
        const reading = cell.querySelector<HTMLElement>(
          '[data-slot="activity-graph-day-reading"]',
        )!
        await expect(reading.classList.contains("nds-sr-only")).toBe(true)
        if (declared.count === 0) {
          await expect(reading.textContent).toContain(labels.none.split("{")[0].trim())
        } else {
          await expect(reading.textContent).toContain(String(declared.count))
          await expect(reading.textContent).toContain(labels.levels[declared.level])
        }
        await expect(reading.textContent).toContain(String(declared.day))
        await expect(reading.textContent).toContain(labels.monthsLong[declared.month])
      }
    })

    await step("A frase do total diz quanto aconteceu e em que janela", async () => {
      const total = root.querySelector<HTMLElement>('[data-slot="activity-graph-total"]')!
      await expect(total.textContent).toContain(String(drawing.total))
      await expect(total.textContent).toContain(labels.monthsLong[drawing.from.month])
      await expect(total.textContent).toContain(labels.monthsLong[drawing.to.month])
    })

    await step("A camada que rola tem papel, nome e parada de teclado", async () => {
      // O par completo: `tabIndex` sem papel deixaria uma parada anônima, e
      // `aria-label` sobre um elemento sem papel é descartado pelo
      // navegador.
      const viewport = root.querySelector<HTMLElement>(
        '[data-slot="activity-graph-viewport"]',
      )!
      await expect(viewport.getAttribute("role")).toBe("group")
      await expect(viewport.getAttribute("aria-label")).toBe(labels.region)
      await expect(viewport.tabIndex).toBe(0)
      // E é a ÚNICA parada: um ano são centenas de paradas que não levam a
      // lugar nenhum, e o nome de cada casa já chega sem foco algum.
      await expect(root.querySelectorAll("[tabindex]").length).toBe(1)
    })

    await step("As duas fileiras de rótulo ficam fora do que é lido em voz", async () => {
      // Elas são âncora para o olho, e a data inteira já vem dentro de cada
      // casa: repeti-la em duas fileiras seria dizer a mesma coisa três
      // vezes.
      const months = root.querySelector<HTMLElement>('[data-slot="activity-graph-months"]')!
      const weekdays = root.querySelector<HTMLElement>(
        '[data-slot="activity-graph-weekdays"]',
      )!
      await expect(months.getAttribute("aria-hidden")).toBe("true")
      await expect(weekdays.getAttribute("aria-hidden")).toBe("true")
      // E elas existem: um rótulo por mês da janela, e os alternados de dia.
      await expect(months.children.length).toBe(drawing.months.length)
      await expect(weekdays.children.length).toBe(drawing.weekdays.length)
    })

    await step("A legenda tem uma amostra por nível, e cada uma diz a sua palavra", async () => {
      // Sem isso a escala existiria só para quem vê.
      const swatches = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="activity-graph-swatch"]'),
      ]
      await expect(swatches.length).toBe(drawing.levels + 1)
      for (const [level, swatch] of swatches.entries()) {
        await expect(swatch.dataset.level).toBe(String(level))
        await expect(swatch.textContent).toContain(labels.levels[level])
      }
    })

    await step("As casas são uma lista ordenada", async () => {
      const list = root.querySelector<HTMLElement>('[data-slot="activity-graph-days"]')!
      await expect(list.tagName).toBe("OL")
    })

    await step("A peça se declara ocupada só enquanto a execução corre", async () => {
      // Nada aqui é região viva: uma grade que se reanunciasse a cada casa é
      // impossível de ouvir.
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
