import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"
import { ComposerVoice } from "./composer-voice"
import { SAMPLE_ELAPSED, SAMPLE_LEVEL, useVoiceLabels, voiceLabels } from "./composer-voice.fixtures"
import { composerVoiceSource } from "./composer-voice.source"
import { VOICE_STATES, isVoiceBusy, type VoiceState } from "@shared/primitives/chat-protocol"
import { ComposerVoiceDocs } from "@/components/docs/ComposerVoiceDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn()

/**
 * Os quatro eixos do controle, num controle só.
 *
 * O estado é o eixo grande e tem story própria em `States`; aqui o assunto é o
 * que muda quando se mexe em cada um — o estado troca o nome e o pressionado do
 * alternador, o nível desenha o som, o tempo aparece na tela sem se anunciar, e
 * o desligado tira o controle do percurso.
 */
type PlaygroundArgs = {
  state: VoiceState
  level: number
  elapsed: string
  disabled: boolean
}

/** Os rótulos vêm de hook, então o render passa por um componente. */
function PlaygroundExample({ state, level, elapsed, disabled }: PlaygroundArgs) {
  return (
    <ComposerVoice
      labels={useVoiceLabels()}
      state={state}
      level={level}
      // Campo de texto vazio é ausência de tempo, e não um tempo em branco: uma
      // string vazia desenharia o separador sem número depois dele.
      elapsed={elapsed || undefined}
      disabled={disabled}
      onToggle={onToggle}
    />
  )
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Conversational/ComposerVoice",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ComposerVoiceDocs),
      source: { transform: composerVoiceSource },
    },
  },
  argTypes: {
    state: {
      control: "select",
      options: [...VOICE_STATES],
      description:
        "Em que ponto o ditado está. Quem capta é quem sabe, e é quem passa.",
      table: {
        type: { summary: VOICE_STATES.map((s) => `'${s}'`).join(" | ") },
        defaultValue: { summary: "'idle'" },
      },
    },
    level: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description:
        "O som que entra, de zero a um. É desenho, e não se anuncia; só aparece enquanto capta.",
      table: { type: { summary: "number" }, defaultValue: { summary: "—" } },
    },
    elapsed: {
      control: "text",
      description:
        "Há quanto tempo a captura corre, já escrito. Fica fora do que se anuncia.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Ditar não está disponível agora. Durante a transcrição o alternador já se desabilita sozinho.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
  },
  args: {
    state: "recording",
    level: SAMPLE_LEVEL,
    elapsed: SAMPLE_ELAPSED,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item6",
      "accessibility.item1",
      "visual.item1",
    ],
  },
  render: (args) => <PlaygroundExample {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer-voice"]')!
    const labels = voiceLabels()
    const busy = isVoiceBusy(args.state)

    await step("Há UM alternador, e ele muda de estado em vez de sumir", async () => {
      // Dois botões que se trocam levariam o foco junto ao sumir, e quem estava
      // neles é despejado no meio da tela.
      await expect(canvas.getAllByRole("button")).toHaveLength(1)
      const toggle = canvas.getByRole("button")
      await expect(toggle.dataset.slot).toBe("composer-voice-toggle")
      await expect(toggle.getAttribute("aria-pressed")).toBe(String(busy))
      await expect(toggle).toHaveAccessibleName(busy ? labels.stop : labels.start)
    })

    await step("O estado escolhido chega em PALAVRA", async () => {
      const status = root.querySelector<HTMLElement>('[data-slot="composer-voice-status"]')!
      await expect(status).toHaveTextContent(labels.status[args.state])
      await expect(root.dataset.state).toBe(args.state)
    })

    await step("O nível entra no desenho por PROPRIEDADE, e só enquanto capta", async () => {
      // Valor de runtime não vai para um `style` de desenho: ali ele sairia do
      // tema, da densidade e da escala tipográfica junto. E medidor sem som
      // seria medidor mentindo, então fora de `recording` ele nem existe.
      const meter = root.querySelector<HTMLElement>('[data-slot="composer-voice-level"]')
      if (args.state !== "recording") {
        await expect(meter).toBeNull()
        return
      }
      await expect(meter!.style.getPropertyValue("--nds-voice-level").trim()).toBe(
        String(args.level),
      )
      await expect(meter!.getAttribute("aria-hidden")).toBe("true")
    })
  },
}
