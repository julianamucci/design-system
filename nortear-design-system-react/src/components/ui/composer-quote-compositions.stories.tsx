import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { Composer } from "./composer"
import { useComposerLabels } from "./composer.fixtures"
import { queue, useAttachmentLabels } from "./composer-attachments.fixtures"
import { quoteLabels, shortQuote, useQuoteLabels } from "./composer-quote.fixtures"
import { quoteShortSource, quoteWithAttachmentsSource } from "./composer-quote.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A citação convivendo com o resto da moldura, e o que acontece ao dispensá-la.

const meta: Meta = {
  title: "Primitives/Conversational/ComposerQuote/Compositions",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: quoteShortSource },
      description: {
        component: "A citação junto dos anexos, e o pedido para tirá-la.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onDismissQuote = fn()

/** Os rótulos vêm de hook, então o render passa por um componente. */
function WithAttachmentsExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      quoteLabels={useQuoteLabels()}
      quote={shortQuote()}
      attachmentLabels={useAttachmentLabels()}
      attachments={queue().slice(0, 2)}
      onDismissQuote={onDismissQuote}
      className="nds-max-w-lg"
    />
  )
}

/** A citação sozinha na moldura — é ela que se dispensa. */
function AloneExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      quoteLabels={useQuoteLabels()}
      quote={shortQuote()}
      onDismissQuote={onDismissQuote}
      className="nds-max-w-lg"
    />
  )
}

export const WithAttachments: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item4"],
    docs: { source: { transform: quoteWithAttachmentsSource } },
  },
  render: () => <WithAttachmentsExample />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const field = root.querySelector<HTMLElement>(".nds-composer-field")!

    await step("Os três moram na mesma moldura", async () => {
      for (const slot of ["composer-quote", "composer-attachments", "composer-input"]) {
        await expect(field.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument()
      }
    })

    await step("E a citação vem PRIMEIRO — contexto antes do que ele contextualiza", async () => {
      // A ordem do documento é a ordem de leitura: quem chega pelo teclado ou
      // por audição encontra a quem responde antes de encontrar o que anexou.
      const order = [...field.children].map((el) => (el as HTMLElement).dataset.slot)
      await expect(order).toEqual([
        "composer-quote",
        "composer-attachments",
        "composer-input",
      ])
    })
  },
}

export const Dismissing: Story = {
  parameters: {
    covers: ["functional.item3", "functional.item4", "accessibility.item5"],
  },
  render: () => <AloneExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const citada = shortQuote()
    const dismiss = () =>
      canvas.getByRole("button", {
        name: quoteLabels().dismiss.replace("{author}", citada.author),
      })

    await step("O alvo de toque tem pelo menos vinte e quatro pixels", async () => {
      // WCAG 2.5.8, num botão de ícone dentro de um bloco estreito.
      const caixa = dismiss().getBoundingClientRect()
      await expect(caixa.width).toBeGreaterThanOrEqual(24)
      await expect(caixa.height).toBeGreaterThanOrEqual(24)
    })

    await step("Acionar avisa quem consome, com a citação junto", async () => {
      onDismissQuote.mockClear()
      await userEvent.click(dismiss())
      await expect(onDismissQuote).toHaveBeenCalledTimes(1)
      await expect(onDismissQuote).toHaveBeenCalledWith(
        expect.objectContaining({ id: citada.id, author: citada.author }),
      )
    })

    await step("E o bloco continua lá — tirar de verdade é de quem recebe", async () => {
      // O componente não decide que a resposta deixou de responder a alguém.
      await expect(root.querySelector('[data-slot="composer-quote"]')).toBeInTheDocument()
    })
  },
}
