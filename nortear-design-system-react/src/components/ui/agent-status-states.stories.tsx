import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent } from "storybook/test"
import { AgentStatus } from "./agent-status"
import { agentStatusLabels, elapsedOf, useAgentStatusLabels } from "./agent-status.fixtures"
import {
  agentStatusCompleteSource,
  agentStatusEveryStateSource,
  agentStatusFailedSource,
  agentStatusRunningSource,
  agentStatusStoppedSource,
} from "./agent-status.source"
import { RUN_STATUSES, type RunStatus } from "@shared/primitives/chat-protocol"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os cinco estados de uma execução. Não há eixo de forma nesta peça: a linha é
// sempre a mesma, e o que muda é em que pé está a resposta.

const meta: Meta = {
  title: "Primitives/Conversational/AgentStatus/States",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: agentStatusEveryStateSource },
      description: {
        component:
          "O estado decide a palavra, a cor do ponto e o que a ação pede — e a ação troca de nome quando troca de função.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn()

/** Os rótulos vêm de hook, então o render passa por um componente. */
function StateExample({ status }: { status: RunStatus }) {
  return (
    <AgentStatus
      status={status}
      elapsed={elapsedOf(status)}
      labels={useAgentStatusLabels()}
      onAction={onAction}
    />
  )
}

/**
 * Os cinco, um abaixo do outro.
 *
 * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
 * novo no vocabulário compartilhado entra nesta story sozinho, que é exatamente
 * o que aquela constante existe para garantir.
 */
function EveryStateExample() {
  const labels = useAgentStatusLabels()
  return (
    <div className="nds-stack" data-spacing="md">
      {RUN_STATUSES.map((status) => (
        <AgentStatus
          key={status}
          status={status}
          elapsed={elapsedOf(status)}
          labels={labels}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

const lineOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!

const actionOf = (line: HTMLElement) =>
  line.querySelector<HTMLButtonElement>('[data-slot="agent-status-action"]')

export const EveryState: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item6",
      "accessibility.item5",
      "visual.item2",
    ],
  },
  render: () => <EveryStateExample />,
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="agent-status"]')]
    const labels = agentStatusLabels()

    await step("Há uma linha por estado, na ordem do vocabulário", async () => {
      await expect(lines).toHaveLength(RUN_STATUSES.length)
      await expect(lines.map((l) => l.dataset.status)).toEqual([...RUN_STATUSES])
    })

    await step("Cada uma traz a PALAVRA daquele estado, e o ponto sai da leitura", async () => {
      for (const [i, status] of RUN_STATUSES.entries()) {
        const line = lines[i]!
        const label = line.querySelector<HTMLElement>('[data-slot="agent-status-label"]')!
        await expect(label.textContent).toBe(labels.status[status])
        const dot = line.querySelector<HTMLElement>('[data-slot="agent-status-dot"]')!
        await expect(dot.getAttribute("aria-hidden")).toBe("true")
      }
    })

    await step("O estado sem rótulo de ação não traz botão nenhum", async () => {
      // Começar uma execução é do campo de mensagem, e sobre uma resposta
      // pronta não há o que fazer aqui — então a linha fica sem ação nos dois.
      for (const [i, status] of RUN_STATUSES.entries()) {
        const expected = labels.action?.[status]
        const button = actionOf(lines[i]!)
        if (expected) await expect(button).toHaveAccessibleName(expected)
        else await expect(button).toBeNull()
      }
    })

    await step("E os rótulos de ação são TRÊS nomes diferentes", async () => {
      // Botão que troca de função sem trocar de nome é o mesmo botão fazendo
      // coisas diferentes, e quem chega nele por tabulação não sabe qual das
      // duas (decisão 4 da folha).
      const names = [...canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="agent-status-action"]',
      )].map((b) => b.textContent)
      await expect(names).toHaveLength(3)
      await expect(new Set(names).size).toBe(3)
    })
  },
}

export const Running: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    docs: { source: { transform: agentStatusRunningSource } },
  },
  render: () => <StateExample status="running" />,
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement)
    const labels = agentStatusLabels()

    await step("Enquanto corre, a ação pede para INTERROMPER", async () => {
      const action = actionOf(line)!
      await expect(action).toHaveAccessibleName(labels.action!.running!)
      onAction.mockClear()
      await userEvent.click(action)
      await expect(onAction).toHaveBeenCalledWith("stop")
    })

    await step("E o relógio segue fora do que é anunciado", async () => {
      const clock = line.querySelector<HTMLElement>('[data-slot="agent-status-elapsed"]')!
      await expect(clock.getAttribute("aria-hidden")).toBe("true")
    })
  },
}

export const Stopped: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: { source: { transform: agentStatusStoppedSource } },
  },
  render: () => <StateExample status="stopped" />,
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement)
    const labels = agentStatusLabels()

    await step("O que a pessoa parou fica NEUTRO, e não em vermelho", async () => {
      // Interromper não é erro, e pintar de vermelho o que ela escolheu fazer é
      // o sistema discordando dela. A diferença para a falha está na palavra e
      // no rótulo da ação, que é o que chega a quem ouve.
      await expect(line.dataset.status).toBe("stopped")
      const label = line.querySelector<HTMLElement>('[data-slot="agent-status-label"]')!
      await expect(label.textContent).toBe(labels.status.stopped)
      await expect(label.textContent).not.toBe(labels.status.failed)
    })

    await step("E a ação oferece RETOMAR, com nome próprio", async () => {
      await expect(actionOf(line)).toHaveAccessibleName(labels.action!.stopped!)
    })
  },
}

export const Failed: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item4"],
    docs: { source: { transform: agentStatusFailedSource } },
  },
  render: () => <StateExample status="failed" />,
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement)
    const labels = agentStatusLabels()

    await step("Depois do fim, a MESMA ação passa a pedir para começar de novo", async () => {
      // Quem responde "já terminou?" é `isRunFinished`, do vocabulário
      // compartilhado — e não um `if` da tela, que renderia cinco versões da
      // mesma regra, uma delas discordando sobre a execução interrompida.
      const action = actionOf(line)!
      await expect(action).toHaveAccessibleName(labels.action!.failed!)
      onAction.mockClear()
      await userEvent.click(action)
      await expect(onAction).toHaveBeenCalledWith("start")
    })

    await step("E o nome dela é OUTRO, porque a função é outra", async () => {
      await expect(labels.action!.failed).not.toBe(labels.action!.running)
    })
  },
}

export const Complete: Story = {
  parameters: {
    docs: { source: { transform: agentStatusCompleteSource } },
  },
  render: () => <StateExample status="complete" />,
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement)

    await step("Sobre uma resposta pronta não há o que fazer aqui", async () => {
      await expect(actionOf(line)).toBeNull()
    })

    await step("E o relógio mostra a duração final, ainda sem se anunciar", async () => {
      // Ele parou de mudar, mas continua fora do anúncio: o que o leitor recebe
      // é a palavra do estado, e a duração é dado de tela.
      const clock = line.querySelector<HTMLElement>('[data-slot="agent-status-elapsed"]')!
      await expect(clock.textContent).toBe(elapsedOf("complete"))
      await expect(clock.getAttribute("aria-hidden")).toBe("true")
    })
  },
}
