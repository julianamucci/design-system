import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import { ContextBreakdown } from "./context-breakdown"
import {
  contextBreakdownLabels,
  partsOf,
  useContextBreakdownLabels,
  useContextBreakdownLabelsWithout,
  type ContextBreakdownCase,
} from "./context-breakdown.fixtures"
import {
  contextBreakdownEmptySource,
  contextBreakdownEveryCaseSource,
  contextBreakdownSingleOriginSource,
  contextBreakdownSliverSource,
  contextBreakdownUnlabeledOriginSource,
} from "./context-breakdown.source"
import { contextSlices, contextTotal } from "@shared/primitives/token-budget"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a repartição diz nas bordas: a parcela que quase não existe, a origem
// que levou tudo, a conversa que ainda não gastou nada, e a origem para a qual
// não há palavra. As quatro são casos em que o desenho sozinho falharia — e é
// por isso que o nome e o número de cada parcela são texto.

const meta: Meta = {
  title: "Primitives/Conversational/ContextBreakdown/States",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextBreakdownEveryCaseSource },
      description: {
        component:
          "Nas bordas o desenho sozinho falha: a fatia vira um fio, some, ou fica sem cor que a explique. O que responde nas quatro é o texto ao lado.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Os rótulos vêm de hook, então o render passa por um componente. */
function CaseExample({ name }: { name: ContextBreakdownCase }) {
  return <ContextBreakdown parts={partsOf(name)} labels={useContextBreakdownLabels()} />
}

/**
 * O mesmo caso típico, com uma origem sem palavra.
 *
 * O caso se produz TIRANDO um rótulo, e nunca inventando uma parcela: o que
 * falta é o que se sabe dizer sobre a repartição, e não a repartição.
 */
function UnlabeledExample({ id }: { id: string }) {
  return (
    <ContextBreakdown
      parts={partsOf("typical")}
      labels={useContextBreakdownLabelsWithout(id)}
    />
  )
}

const blockOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="context-breakdown"]')!

const rowsOf = (block: HTMLElement) => [
  ...block.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-part"]'),
]

const cutsOf = (block: HTMLElement) => [
  ...block.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-slice"]'),
]

const textOf = (row: HTMLElement, slot: string) =>
  row.querySelector<HTMLElement>(`[data-slot="context-breakdown-${slot}"]`)!.textContent

/**
 * Uma parcela que vale quatro décimos de um por cento.
 *
 * A fatia é um fio na barra, e o que salva a parcela é o número em texto ao lado
 * do nome — que é a razão de a peça inteira não confiar em cor. É também onde a
 * trava de baixo do por cento se vê: o peso sai como um, e não como zero, e por
 * isso a coluna soma noventa e nove.
 */
export const Sliver: Story = {
  parameters: {
    covers: ["functional.item3", "visual.item2"],
    docs: { source: { transform: contextBreakdownSliverSource } },
  },
  render: () => <CaseExample name="sliver" />,
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement)
    const slices = contextSlices(partsOf("sliver"))
    const sliver = slices[slices.length - 1]!

    await step("A parcela vale menos de um por cento de verdade", async () => {
      await expect(sliver.fraction).toBeLessThan(0.01)
      await expect(sliver.tokens).toBeGreaterThan(0)
    })

    await step("E o peso sai como UM por cento, e nunca como zero", async () => {
      // Uma parcela com tokens de verdade que aparecesse como 0% diria que ela
      // não existe. A trava é do primitivo, e vale para as cinco.
      await expect(sliver.percent).toBe(1)
      const row = rowsOf(block)[slices.length - 1]!
      await expect(textOf(row, "percent")).toBe("1%")
      await expect(textOf(row, "tokens")).toBe(
        `${sliver.tokens.toLocaleString()} ${contextBreakdownLabels().unit}`,
      )
    })

    await step("Por isso a coluna soma noventa e nove, e isso é honesto", async () => {
      // Somar cem exigiria arredondar a parcela mínima para baixo — ou seja,
      // mentir sobre a única parcela que precisa do número para existir.
      const sum = slices.reduce((total, slice) => total + slice.percent, 0)
      await expect(sum).toBe(99)
    })
  },
}

/**
 * Tudo veio de uma procedência só.
 *
 * A barra fica de uma cor só, e as três parcelas zeradas CONTINUAM na legenda —
 * é a decisão do primitivo, e é ela que mantém a cor de cada linha apontando
 * para a fatia certa.
 */
export const SingleOrigin: Story = {
  parameters: {
    covers: ["functional.item4", "accessibility.item4", "visual.item3"],
    docs: { source: { transform: contextBreakdownSingleOriginSource } },
  },
  render: () => <CaseExample name="single" />,
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement)
    const parts = partsOf("single")
    const rows = rowsOf(block)
    const labels = contextBreakdownLabels()

    await step("As parcelas zeradas continuam na lista, e na posição delas", async () => {
      // Sumir com a zerada desalinharia legenda e barra, e a cor de cada linha
      // passaria a apontar para a fatia da vizinha — que continua parecendo
      // certa, e é por isso que é o pior defeito possível aqui.
      await expect(rows).toHaveLength(parts.length)
      await expect(cutsOf(block)).toHaveLength(parts.length)
      await expect(rows.map((row) => textOf(row, "name"))).toEqual(
        parts.map((part) => labels.parts[part.id]),
      )
    })

    await step("E cada uma continua sendo LIDA, com nome e com zero", async () => {
      for (const [i, part] of parts.entries()) {
        if (part.tokens > 0) continue
        await expect(textOf(rows[i]!, "percent")).toBe("0%")
        await expect(textOf(rows[i]!, "name")).toBe(labels.parts[part.id])
      }
    })

    await step("A origem que levou tudo sai como cem por cento", async () => {
      const filled = parts.findIndex((part) => part.tokens > 0)
      await expect(textOf(rows[filled]!, "percent")).toBe("100%")
    })
  },
}

/**
 * A conversa que ainda não começou.
 *
 * Não há o que repartir, e o vazio aqui é VERDADE — diferente da peça vizinha,
 * em que um medidor vazio mentiria sobre um teto desconhecido. Por isso a barra
 * fica e aparece vazia, em vez de sumir.
 */
export const Empty: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item4"],
    docs: { source: { transform: contextBreakdownEmptySource } },
  },
  render: () => <CaseExample name="empty" />,
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement)
    const parts = partsOf("empty")
    const labels = contextBreakdownLabels()

    await step("O total é zero, e o zero é a resposta", async () => {
      await expect(contextTotal(parts)).toBe(0)
      const total = block.querySelector<HTMLElement>('[data-slot="context-breakdown-total"]')!
      await expect(total.textContent).toBe(`0 ${labels.unit}`)
    })

    await step("Todas as parcelas ficam na lista, todas em zero", async () => {
      const rows = rowsOf(block)
      await expect(rows).toHaveLength(parts.length)
      for (const row of rows) await expect(textOf(row, "percent")).toBe("0%")
    })

    await step("E nenhum número sai indefinido", async () => {
      // Dividir por zero na tela aconteceria SEMPRE na primeira vez que alguém
      // abre a peça, que é o pior momento possível.
      for (const cut of cutsOf(block)) {
        await expect(cut.style.getPropertyValue("--nds-context-share")).toBe("0")
      }
      await expect(block.textContent).not.toContain("NaN")
    })
  },
}

/**
 * Uma origem para a qual não há palavra.
 *
 * O caso se produz TIRANDO um rótulo, e nunca inventando uma parcela: o que
 * falta é o que se sabe dizer sobre a repartição, e não a repartição. Sem nome,
 * a cor ficaria sozinha dizendo de qual parcela se trata — e é justamente isso
 * que a peça não aceita.
 */
export const UnlabeledOrigin: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item5"],
    docs: { source: { transform: contextBreakdownUnlabeledOriginSource } },
  },
  render: () => <UnlabeledExample id="tools" />,
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement)
    const parts = partsOf("typical")
    const unlabeled = parts.findIndex((part) => part.id === "tools")
    const rows = rowsOf(block)

    await step("A linha continua na lista, e na posição dela", async () => {
      await expect(rows).toHaveLength(parts.length)
    })

    await step("E ela mostra o ENDEREÇO da origem, em vez de ficar em branco", async () => {
      const label = textOf(rows[unlabeled]!, "name")
      await expect(label).toBe("tools")
      await expect(label?.trim()).not.toBe("")
    })

    await step("As demais continuam com a palavra delas", async () => {
      const labels = contextBreakdownLabels()
      for (const [i, part] of parts.entries()) {
        if (i === unlabeled) continue
        await expect(textOf(rows[i]!, "name")).toBe(labels.parts[part.id])
      }
    })
  },
}
