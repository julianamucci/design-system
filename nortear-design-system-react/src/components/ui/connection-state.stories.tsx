import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"
import { ConnectionState } from "./connection-state"
import { connectionStateLabels, useConnectionStateLabels, CONNECTION_COUNTDOWN } from "./connection-state.fixtures"
import { connectionStateSource } from "./connection-state.source"
import {
  CONNECTION_STATES,
  // Apelido de módulo: o componente publicado ocupa o nome. Ver o docblock de
  // `connection-state.tsx`.
  type ConnectionState as ConnectionStateValue,
} from "@shared/primitives/chat-protocol"
import { ConnectionStateDocs } from "@/components/docs/ConnectionStateDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRetry = fn()

/**
 * Os dois eixos da linha, numa linha só.
 *
 * O estado decide a palavra, a cor do ponto, se a contagem tem o que contar e o
 * que a ação oferece; a contagem é o único pedaço que se vê e não se ouve. A
 * grade dos três estados mora em `States`; aqui o assunto é o que muda quando
 * se mexe em cada eixo.
 */
type PlaygroundArgs = {
  state: ConnectionStateValue
  countdown: string
}

/** Os rótulos vêm de hook, então o render passa por um componente. */
function PlaygroundExample({ state, countdown }: PlaygroundArgs) {
  return (
    <ConnectionState
      state={state}
      // Campo de texto vazio é ausência de contagem, e não uma contagem em
      // branco: uma string vazia desenharia um vão sem número.
      countdown={countdown || undefined}
      labels={useConnectionStateLabels()}
      onRetry={onRetry}
    />
  )
}

const meta: Meta<PlaygroundArgs> = {
  title: "Primitives/Conversational/ConnectionState",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ConnectionStateDocs),
      source: { transform: connectionStateSource },
    },
  },
  argTypes: {
    state: {
      control: "select",
      options: [...CONNECTION_STATES],
      description:
        "Em que pé está a ligação. Decide a palavra, a cor do ponto, se a contagem tem o que contar e o que a ação oferece.",
      table: {
        type: { summary: CONNECTION_STATES.map((s) => `'${s}'`).join(" | ") },
        defaultValue: { summary: "'connected'" },
      },
    },
    countdown: {
      control: "text",
      description:
        "Quanto falta para a próxima tentativa, já escrito. Só é desenhado enquanto alguma tentativa está marcada, e fica fora do que é anunciado.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    state: "reconnecting",
    countdown: CONNECTION_COUNTDOWN,
  },
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item2", "functional.item4",
      "accessibility.item1", "accessibility.item2",
      "accessibility.item3", "accessibility.item4",
      "visual.item1",
    ],
  },
  render: (args) => <PlaygroundExample {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-state"]')!
    const labels = connectionStateLabels()

    await step("A palavra do estado escolhido está na linha", async () => {
      // A cor do ponto é a única diferença visual entre os três, e cor sozinha
      // não descreve estado (WCAG 1.4.1).
      await expect(root.dataset.state).toBe(args.state)
      const label = root.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!
      await expect(label.textContent).toBe(labels.state[args.state])
    })

    await step("E o ponto fica FORA do que é lido em voz", async () => {
      const dot = root.querySelector<HTMLElement>('[data-slot="connection-state-dot"]')!
      await expect(dot.getAttribute("aria-hidden")).toBe("true")
      await expect(dot.textContent).toBe("")
    })

    await step("A região que se anuncia é SÓ a palavra", async () => {
      // Perder a ligação é o chão saindo, e não o passo seguinte de algo que ia
      // bem — por isso aqui existe região viva, ao contrário do resto da folha
      // (decisão 1). Mas ela envolve um elemento que carrega uma coisa só.
      const label = root.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!
      await expect(label.getAttribute("role")).toBe("status")
      await expect(root.hasAttribute("role")).toBe(false)
      await expect(root.hasAttribute("aria-live")).toBe(false)
      const live = [...root.querySelectorAll('[role="status"], [role="alert"], [role="log"], [aria-live]')]
      await expect(live).toEqual([label])
    })

    await step("A contagem aparece no estado que a tem, e fica fora da região", async () => {
      // Um número que se reescreve a cada segundo torna a tela impossível de
      // ouvir (regra 9 da guideline 17). Ela é vizinha da região viva, e não
      // filha dela.
      const label = root.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!
      const clock = root.querySelector<HTMLElement>('[data-slot="connection-state-countdown"]')
      if (args.state === "reconnecting" && args.countdown) {
        await expect(clock!.textContent).toBe(args.countdown)
        await expect(clock!.getAttribute("aria-hidden")).toBe("true")
        await expect(label.contains(clock)).toBe(false)
        await expect(within(canvasElement).queryByText(args.countdown)).toBeInTheDocument()
      } else {
        await expect(clock).toBeNull()
      }
    })
  },
}
