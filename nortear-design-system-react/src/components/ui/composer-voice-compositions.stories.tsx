import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { Composer } from "./composer"
import { ComposerVoice } from "./composer-voice"
import { useComposerLabels } from "./composer.fixtures"
import {
  SAMPLE_ELAPSED,
  SAMPLE_LEVEL,
  useVoiceLabels,
  voiceLabels,
} from "./composer-voice.fixtures"
import { voiceInRailSource } from "./composer-voice.source"
import type { VoiceState } from "@shared/primitives/chat-protocol"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O controle é AUTÔNOMO: o campo não sabe que ele existe, e o trilho é um
// espaço. Quem consome põe o ditado ali, do mesmo jeito que poria qualquer
// outro controle — e é isso que estas stories mostram.

const meta: Meta = {
  title: "Components/Conversational/ComposerVoice/Compositions",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: voiceInRailSource },
      description: {
        component:
          "O lugar do controle no trilho, e o que ele deliberadamente NÃO faz quando alguém o aciona.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn()

/** O controle no início do trilho, num estado fixo. */
function InRailExample({ state }: { state: VoiceState }) {
  return (
    <Composer
      labels={useComposerLabels()}
      railStart={
        <ComposerVoice
          labels={useVoiceLabels()}
          state={state}
          level={state === "recording" ? SAMPLE_LEVEL : undefined}
          elapsed={state === "recording" ? SAMPLE_ELAPSED : undefined}
          onToggle={onToggle}
        />
      }
      className="nds-max-w-lg"
    />
  )
}

/**
 * A permissão que só quem CONSOME resolve.
 *
 * DIVERGÊNCIA DE FORMA, e o motivo é o renderizador: numa stack imperativa a
 * play troca o nó do controle por outro para provar que o segundo pedido sai do
 * MESMO botão. Aqui a tela é função do estado, então quem faz o papel de quem
 * consome é este interruptor de módulo: enquanto ele está desligado, acionar o
 * alternador avisa e mais nada — que é exatamente o que a story precisa provar.
 */
let granted = false

/** O controle no trilho, com o estado na mão de quem consome. */
function TogglingExample() {
  const [state, setState] = React.useState<VoiceState>("idle")

  return (
    <Composer
      labels={useComposerLabels()}
      railStart={
        <ComposerVoice
          labels={useVoiceLabels()}
          state={state}
          level={state === "recording" ? SAMPLE_LEVEL : undefined}
          elapsed={state === "recording" ? SAMPLE_ELAPSED : undefined}
          onToggle={(intent) => {
            onToggle(intent)
            // O componente NÃO se mexe sozinho: quem capta é que decide, e
            // enquanto a permissão não vem a tela fica onde estava.
            if (granted) setState(intent === "start" ? "recording" : "idle")
          }}
        />
      }
      className="nds-max-w-lg"
    />
  )
}

export const InRail: Story = {
  parameters: { covers: ["functional.item8", "visual.item6"] },
  render: () => <InRailExample state="recording" />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const voice = root.querySelector<HTMLElement>('[data-slot="composer-voice"]')!

    await step("O controle vive no INÍCIO do trilho", async () => {
      // O início do trilho é o que se acrescenta à mensagem; o fim é o que se
      // faz com ela. Ditar é acrescentar.
      const railStart = root.querySelector<HTMLElement>(".nds-composer-rail-start")!
      await expect(railStart.contains(voice)).toBe(true)
    })

    await step("E ele está no percurso do teclado, antes do envio", async () => {
      // Nada no trilho aparece só no `:hover`: estes são os controles do campo
      // e existem o tempo todo (decisão 4 da folha do composer).
      const toggle = voice.querySelector<HTMLElement>('[data-slot="composer-voice-toggle"]')!
      const submit = root.querySelector<HTMLElement>('[data-slot="composer-submit"]')!
      toggle.focus()
      await expect(root.ownerDocument.activeElement).toBe(toggle)
      await expect(
        toggle.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    await step("O campo NÃO ganha o ditado na descrição dele", async () => {
      // A citação descreve o campo porque saber a quem se responde muda o que
      // se escreve. O ditado é um controle, e um controle na descrição do campo
      // vira ruído que se ouve a cada foco.
      const input = root.querySelector<HTMLElement>('[data-slot="composer-input"]')!
      const ids = (input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean)
      const describers = ids.map((id) => root.ownerDocument.getElementById(id))
      for (const el of describers) {
        await expect(el?.contains(voice)).toBe(false)
      }
    })
  },
}

export const Toggling: Story = {
  parameters: {
    covers: ["functional.item3", "functional.item4", "accessibility.item6"],
  },
  render: () => <TogglingExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const labels = voiceLabels()
    const toggle = () =>
      root.querySelector<HTMLElement>('[data-slot="composer-voice-toggle"]')!
    const voice = () => root.querySelector<HTMLElement>('[data-slot="composer-voice"]')!

    granted = false

    await step("O alvo de toque tem pelo menos vinte e quatro pixels", async () => {
      // WCAG 2.5.8, e é onde esta família mais escorrega: o trilho é feito de
      // botões de ícone, que não têm texto para crescer.
      const box = toggle().getBoundingClientRect()
      await expect(box.width).toBeGreaterThanOrEqual(24)
      await expect(box.height).toBeGreaterThanOrEqual(24)
    })

    await step("Em repouso, acioná-lo pede para COMEÇAR", async () => {
      // O pedido é INTENÇÃO, e não o estado seguinte: entre pedir e captar
      // existe uma permissão que só quem consome resolve.
      onToggle.mockClear()
      await userEvent.click(toggle())
      await expect(onToggle).toHaveBeenCalledTimes(1)
      await expect(onToggle).toHaveBeenCalledWith("start")
    })

    await step("E o controle NÃO muda sozinho — captar é de quem consome", async () => {
      await expect(voice().dataset.state).toBe("idle")
      await expect(toggle().getAttribute("aria-pressed")).toBe("false")
    })

    await step("Captando, o mesmo botão pede para PARAR", async () => {
      // Quem troca o estado é quem consome; a story faz o papel dele para
      // provar que o segundo pedido sai do MESMO botão.
      granted = true
      onToggle.mockClear()
      await userEvent.click(toggle())

      const stopButton = await canvas.findByRole("button", { name: labels.stop })
      await expect(stopButton).toBe(toggle())
      await expect(voice().dataset.state).toBe("recording")

      onToggle.mockClear()
      await userEvent.click(toggle())
      await expect(onToggle).toHaveBeenCalledTimes(1)
      await expect(onToggle).toHaveBeenCalledWith("stop")
    })
  },
}
