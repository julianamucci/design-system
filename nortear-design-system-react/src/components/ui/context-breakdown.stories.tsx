import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { ContextBreakdown } from "./context-breakdown"
import {
  contextBreakdownLabels,
  useContextBreakdownLabels,
} from "./context-breakdown.fixtures"
import { contextBreakdownSource } from "./context-breakdown.source"
import {
  CONTEXT_PART_IDS,
  type ContextPartId,
} from "@shared/primitives/context-breakdown-examples"
import { contextSlices, contextTotal } from "@shared/primitives/token-budget"
import { ContextBreakdownDocs } from "@/components/docs/ContextBreakdownDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/**
 * O único eixo desta peça: quanto cada origem trouxe.
 *
 * Não há forma alternativa nem nível — o que muda a repartição é o peso de cada
 * parcela, e é isso que os controls mexem. Uma origem em zero continua na lista,
 * e é o control mais interessante daqui: é ele que mostra a decisão que segura a
 * cor de cada linha no lugar.
 *
 * As quatro origens são as do exemplo compartilhado, na ordem canônica — a do
 * CICLO DE VIDA do contexto, e não a do tamanho.
 */
type PlaygroundArgs = Record<ContextPartId, number>

/** As parcelas dos controls, na ordem canônica das origens compartilhadas. */
const partsFrom = (args: PlaygroundArgs) =>
  CONTEXT_PART_IDS.map((id) => ({ id, tokens: args[id] }))

/** Os rótulos vêm de hook, então o render passa por um componente. */
function PlaygroundExample(args: PlaygroundArgs) {
  return (
    <ContextBreakdown parts={partsFrom(args)} labels={useContextBreakdownLabels()} />
  )
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Conversational/ContextBreakdown",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ContextBreakdownDocs),
      source: { transform: contextBreakdownSource },
    },
  },
  argTypes: {
    system: {
      control: { type: "number", min: 0, step: 500 },
      description: "Quanto as instruções do sistema trouxeram.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    history: {
      control: { type: "number", min: 0, step: 500 },
      description: "Quanto o histórico da conversa trouxe.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    attachments: {
      control: { type: "number", min: 0, step: 500 },
      description: "Quanto os anexos trouxeram.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    tools: {
      control: { type: "number", min: 0, step: 500 },
      description:
        "Quanto os resultados de ferramenta trouxeram. Em zero, a parcela continua na lista — é ela que mantém a cor das linhas seguintes no lugar.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
  },
  args: {
    system: 1_500,
    history: 17_000,
    attachments: 5_000,
    tools: 1_500,
  },
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2",
      "accessibility.item1", "accessibility.item2",
      "accessibility.item3", "accessibility.item5",
      "visual.item1",
    ],
  },
  render: (args) => <PlaygroundExample {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="context-breakdown"]')!
    const labels = contextBreakdownLabels()
    const parts = partsFrom(args)
    const slices = contextSlices(parts)

    const rows = [...root.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-part"]')]
    const bar = root.querySelector<HTMLElement>('[data-slot="context-breakdown-bar"]')!
    const cuts = [...bar.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-slice"]')]

    await step("O bloco NÃO é região viva, e nada nele se reanuncia", async () => {
      // Os números mudam a cada turno, e anunciá-los a cada mudança corta a
      // leitura da resposta que está sendo gerada ao lado (decisão 1 da folha).
      await expect(root.hasAttribute("aria-live")).toBe(false)
      await expect(root.hasAttribute("role")).toBe(false)
      await expect(root.querySelector("[aria-live]")).toBeNull()
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull()
    })

    await step("O título diz o que está sendo repartido, e o total é o denominador", async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="context-breakdown-title"]')!
      await expect(title.textContent).toBe(labels.title)
      const total = root.querySelector<HTMLElement>('[data-slot="context-breakdown-total"]')!
      await expect(total.textContent).toBe(
        `${contextTotal(parts).toLocaleString()} ${labels.unit}`,
      )
    })

    await step("Há uma fatia e uma linha por origem, e as duas contagens batem", async () => {
      // É essa igualdade que faz o pareamento de cor por posição funcionar: uma
      // fatia a menos deslocaria a cor de todas as linhas seguintes.
      await expect(rows).toHaveLength(slices.length)
      await expect(cuts).toHaveLength(slices.length)
    })

    await step("E a ordem é a de quem mediu, e nunca a do tamanho", async () => {
      // A legenda se lê por posição: parcela que sobe de lugar entre um turno e
      // o seguinte faz comparar duas fotos diferentes achando que é a mesma.
      const readNames = rows.map(
        (row) => row.querySelector<HTMLElement>('[data-slot="context-breakdown-name"]')!.textContent,
      )
      await expect(readNames).toEqual(slices.map((slice) => labels.parts[slice.id]))
    })

    await step("Cada linha traz nome, contagem e peso em TEXTO", async () => {
      // Cor sozinha não descreve nada (WCAG 1.4.1, decisão 2 da folha).
      const canvas = within(canvasElement)
      for (const [i, slice] of slices.entries()) {
        const row = rows[i]!
        await expect(
          row.querySelector<HTMLElement>('[data-slot="context-breakdown-name"]')!.textContent,
        ).toBe(labels.parts[slice.id])
        await expect(
          row.querySelector<HTMLElement>('[data-slot="context-breakdown-tokens"]')!.textContent,
        ).toBe(`${slice.tokens.toLocaleString()} ${labels.unit}`)
        await expect(
          row.querySelector<HTMLElement>('[data-slot="context-breakdown-percent"]')!.textContent,
        ).toBe(`${slice.percent}%`)
      }
      await expect(canvas.getByText(labels.title)).toBeInTheDocument()
    })

    await step("A fatia desenha o MESMO peso que a linha diz", async () => {
      // Uma fatia que discordasse do número ao lado seriam duas respostas para
      // uma pergunta só — por isso as duas leem o mesmo inteiro.
      for (const [i, slice] of slices.entries()) {
        await expect(cuts[i]!.style.getPropertyValue("--nds-context-share")).toBe(
          String(slice.percent),
        )
      }
    })

    await step("E a barra fica FORA do que é lido, sem papel e sem valor", async () => {
      // Um segundo portador dos mesmos números os faria ser lidos duas vezes,
      // uma delas como controle (decisões 1 e 2 da folha).
      await expect(bar.getAttribute("aria-hidden")).toBe("true")
      await expect(bar.hasAttribute("role")).toBe(false)
      await expect(bar.hasAttribute("aria-valuenow")).toBe(false)
      await expect(bar.textContent).toBe("")
    })

    await step("A legenda é uma lista de verdade", async () => {
      // A contagem e a posição de cada parcela chegam a quem ouve, e é por
      // posição que esta repartição pede para ser comparada (decisão 3).
      const legend = root.querySelector<HTMLElement>('[data-slot="context-breakdown-legend"]')!
      await expect(legend.tagName).toBe("UL")
      for (const row of rows) await expect(row.tagName).toBe("LI")
    })
  },
}
