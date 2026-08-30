import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { Composer } from "./composer"
import { composerLabels, textOfLength, useComposerLabels } from "./composer.fixtures"
import {
  composerDisabledSource,
  composerFilledSource,
  composerNearLimitSource,
  composerRunningSource,
  composerSource,
} from "./composer.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado vazio é o Playground, e não se
// repete aqui.

const meta: Meta = {
  title: "UI/Composer/States",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerSource },
      description: {
        component: "Cada story fixa um estado e verifica o que ele muda no campo.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn()
const onStop = fn()

const LIMIT = 120

const SAMPLE = "Resume a última reunião."

export const Filled: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: { source: { transform: composerFilledSource } },
  },
  render: () => <FilledExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Com texto, o envio está disponível", async () => {
      await expect(canvas.getByRole("button", { name: composerLabels().submit })).toBeEnabled()
    })
  },
}

function FilledExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      value={SAMPLE}
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}

/**
 * A geração em curso, com o interruptor de quem consome.
 *
 * Nesta stack `running` é PROP — não há `setRunning` para a play chamar —,
 * então quem liga o estado é um controle na tela. Ele também é o contrato de
 * verdade: `onStop` avisa, e quem consome decide desligar. O painel Code mostra
 * o uso real, pela transform.
 */
function RunningExample() {
  const labels = useComposerLabels()
  // `running` fica FIXO, e é o que faz esta story fotografar a mesma tela que
  // as outras quatro. Desligar a geração aqui obrigaria um controle extra na
  // tela para restabelecer a precondição na reexecução do painel Interactions —
  // e esse controle entraria na foto do Chromatic em três stacks e em duas não.
  // Que o botão volta ao envio quem afirma é a story `Filled`.
  return (
    <Composer
      className="nds-max-w-lg"
      labels={labels}
      value={SAMPLE}
      running
      onSubmit={onSubmit}
      onStop={onStop}
    />
  )
}

export const Running: Story = {
  parameters: {
    covers: ["functional.item7", "accessibility.item4", "visual.item4"],
    docs: { source: { transform: composerRunningSource } },
  },
  render: () => <RunningExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox")
    const labels = composerLabels()
    await step("O botão troca de NOME, e não só de forma", async () => {
      // Precondição própria sem controle na tela: a geração fica ligada o
      // tempo todo, então a reexecução parte do mesmo estado.
      //
      // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
      // botão faz agora — e agora ele faz o oposto do que fazia.
      await expect(canvas.getByRole("button", { name: labels.stop })).toBeInTheDocument()
      await expect(canvas.queryByRole("button", { name: labels.submit })).toBeNull()
    })

    await step("A tecla de envio não envia enquanto gera", async () => {
      // Um segundo envio no meio do primeiro é o defeito que este estado
      // existe para impedir.
      onSubmit.mockClear()
      input.focus()
      await userEvent.keyboard("{Enter}")
      await expect(onSubmit).not.toHaveBeenCalled()
    })

    await step("O botão interrompe, e não envia", async () => {
      onSubmit.mockClear()
      onStop.mockClear()
      await userEvent.click(canvas.getByRole("button", { name: labels.stop }))
      await expect(onStop).toHaveBeenCalledTimes(1)
      await expect(onSubmit).not.toHaveBeenCalled()
    })

  },
}

function NearLimitExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      maxLength={LIMIT}
      // Nove décimos do limite é onde o contador muda de cor e de peso.
      value={textOfLength(Math.ceil(LIMIT * 0.95))}
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}

export const NearLimit: Story = {
  parameters: {
    covers: ["accessibility.item3", "visual.item5"],
    docs: { source: { transform: composerNearLimitSource } },
  },
  render: () => <NearLimitExample />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const counter = root.querySelector<HTMLElement>(".nds-composer-counter")!

    await step("Perto do limite, o contador marca DOIS sinais", async () => {
      // Cor sozinha não descreve estado para quem não a percebe (1.4.1). O
      // peso é o segundo sinal, e é ele que sobrevive à visão de cores.
      //
      // Sem `waitFor`: o peso não é propriedade em transição na folha do
      // componente — só a borda e a sombra da moldura são —, então o valor já
      // é final. `waitFor` com leitura que força layout se reagenda por
      // observador de mutação e pendura o arquivo sem reportar nada.
      await expect(counter.dataset.nearLimit).toBe("true")
      await expect(getComputedStyle(counter).fontWeight).toBe("600")
    })

    await step("O contador está FORA do que é lido em voz", async () => {
      // Ele muda a cada tecla: um número reanunciado a cada letra torna o
      // campo impossível de usar por audição. O limite chega uma vez, pela
      // descrição do campo — que é texto estático.
      await expect(counter).toHaveAttribute("aria-hidden", "true")
      await expect(root.querySelector("[aria-live]")).toBeNull()
      await expect(within(canvasElement).getByRole("textbox")).toHaveAccessibleDescription(
        new RegExp(String(LIMIT)),
      )
    })
  },
}

function DisabledExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      value={SAMPLE}
      disabled
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item8", "visual.item6"],
    docs: { source: { transform: composerDisabledSource } },
  },
  render: () => <DisabledExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox")

    await step("Campo e envio saem do percurso do teclado", async () => {
      await expect(input).toBeDisabled()
      await expect(canvas.getByRole("button", { name: composerLabels().submit })).toBeDisabled()
    })

    await step("E nada envia, nem por tecla", async () => {
      onSubmit.mockClear()
      // O campo desabilitado não recebe foco, então a tecla vai para o
      // documento — o que se afirma é que nada saiu de qualquer forma.
      await userEvent.keyboard("{Enter}")
      await expect(onSubmit).not.toHaveBeenCalled()
    })
  },
}
