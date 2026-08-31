import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Button } from "./button"
import { ChatThread } from "./chat-thread"
import { useChatLabels } from "./chat-thread.fixtures"
import { Composer } from "./composer"
import { composerLabels, useComposerLabels } from "./composer.fixtures"
import { Markdown } from "./markdown"
import { ThinkingIndicator } from "./thinking-indicator"
import {
  answerText,
  askedMessages,
  questionText,
  useIndicatorLabels,
} from "./thinking-indicator.fixtures"
import {
  indicatorReplacingSource,
  indicatorWithComposerSource,
} from "./thinking-indicator.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A troca — que é a única regra da peça que ela não consegue cumprir sozinha —
// e a convivência com o campo que já oferece interromper.

const meta: Meta = {
  title: "Primitives/Conversational/ThinkingIndicator/Compositions",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: indicatorReplacingSource },
      description: {
        component:
          "Como o texto ocupa o lugar do indicador, e como ele convive com quem já oferece interromper.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Os rótulos vêm de hook, então o render passa por um componente. */
function ReplacingExample() {
  const labels = useIndicatorLabels()
  const [arrived, setArrived] = useState(false)

  return (
    <div className="nds-stack nds-max-w-lg" data-spacing="md">
      <div className="nds-stack" data-spacing="sm">
        <Markdown content={questionText()} />
        {arrived ? (
          <Markdown content={answerText()} />
        ) : (
          <ThinkingIndicator label={labels.generating} />
        )}
      </div>

      {/* O controle é o andaime da demonstração, e ocupa aqui o lugar que na
          vida real é do primeiro trecho de texto chegando pelo protocolo. A
          troca é a mesma: quem monta a conversa tira o indicador e põe a
          resposta. */}
      <Button
        data-slot="thinking-indicator-reveal"
        variant="secondary"
        size="sm"
        onClick={() => setArrived(true)}
      >
        {labels.reveal}
      </Button>
    </div>
  )
}

function WithComposerExample() {
  const labels = useIndicatorLabels()
  const chatLabels = useChatLabels()
  const fieldLabels = useComposerLabels()

  return (
    <div className="nds-stack nds-max-w-lg" data-spacing="sm">
      <ChatThread messages={askedMessages()} labels={chatLabels} size="xs" />
      <ThinkingIndicator label={labels.generating} />
      {/* O campo é quem oferece o que fazer a respeito da espera. O indicador
          não duplica esse controle: ele diz que a resposta vem, e nada mais. */}
      <Composer labels={fieldLabels} running />
    </div>
  )
}

export const Replacing: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item4"],
  },
  render: () => <ReplacingExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const reveal = canvasElement.querySelector<HTMLElement>(
      '[data-slot="thinking-indicator-reveal"]',
    )!

    await step("Antes do texto, o indicador ocupa o lugar da resposta", async () => {
      await expect(canvas.getByRole("status")).toBeInTheDocument()
      await expect(canvasElement.querySelectorAll('[data-slot="markdown"]')).toHaveLength(1)
    })

    await step("O texto chega, e o indicador SAI do documento", async () => {
      // Sumir é de quem monta a conversa: o componente não sabe que o primeiro
      // trecho chegou, e um indicador que ficasse ao lado do texto já entregue
      // diria que se espera pelo que já veio.
      await userEvent.click(reveal)
      await expect(
        canvasElement.querySelector('[data-slot="thinking-indicator"]'),
      ).toBeNull()
      await expect(canvas.queryByRole("status")).toBeNull()
    })

    await step("E a resposta ocupa exatamente o lugar dele", async () => {
      const blocks = canvasElement.querySelectorAll('[data-slot="markdown"]')
      await expect(blocks).toHaveLength(2)
      await expect(blocks[1]).toHaveTextContent(answerText().slice(0, 24))
    })
  },
}

export const WithComposer: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item5", "visual.item5"],
    docs: { source: { transform: indicatorWithComposerSource } },
  },
  render: () => <WithComposerExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Há uma SÓ região de estado enquanto se espera", async () => {
      // Dois anúncios ao mesmo tempo se atropelam, e nenhum dos dois é ouvido
      // inteiro. A espera se anuncia uma vez, e quem a anuncia é o indicador.
      const regions = canvas.getAllByRole("status")
      await expect(regions).toHaveLength(1)
      await expect(regions[0]!.dataset.slot).toBe("thinking-indicator")
    })

    await step("Só o campo oferece o que acionar", async () => {
      // O indicador não tem controle nenhum: interromper mora com quem já
      // oferece esse controle, e um segundo botão dividiria a mesma ação em
      // dois lugares.
      const indicator = canvasElement.querySelector<HTMLElement>(
        '[data-slot="thinking-indicator"]',
      )!
      await expect(indicator.querySelectorAll("button")).toHaveLength(0)
      await expect(
        canvas.getByRole("button", { name: composerLabels().stop }),
      ).toBeInTheDocument()
    })
  },
}
