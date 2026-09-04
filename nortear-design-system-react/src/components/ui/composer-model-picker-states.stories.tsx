import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent } from "storybook/test"
import { ComposerModelPicker } from "./composer-model-picker"
import { everyModel, useModelLabels } from "./composer-model-picker.fixtures"
import {
  modelPickerClosedSource,
  modelPickerUnavailableSource,
} from "./composer-model-picker.source"
import { isModelSelectable } from "@shared/primitives/chat-protocol"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que ACONTECE com a lista: ela está fechada, ou está aberta com um modelo
// que não pode responder agora. A forma de cada opção — etiqueta, descrição —
// mora em `Variants`.

const meta: Meta = {
  title: "Components/Conversational/ComposerModelPicker/States",
  tags: ["conversational"],
  parameters: {
    // A lista abre PARA CIMA: no topo do quadro ela sairia da foto.
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: modelPickerUnavailableSource },
      description: {
        component:
          "Em repouso o gatilho carrega o nome escolhido; aberta, a lista guarda quem não pode responder agora — e o motivo.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onValueChange = fn()

/** Os rótulos vêm de hook, então o render passa por um componente. */
function StateExample({ value, open }: { value: string; open: boolean }) {
  return (
    <ComposerModelPicker
      labels={useModelLabels()}
      models={everyModel()}
      value={value}
      open={open}
      onValueChange={onValueChange}
    />
  )
}

const panelOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-model-panel"]')

export const Closed: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: modelPickerClosedSource } },
  },
  render: () => <StateExample value="balanced" open={false} />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer-model"]')!
    const trigger = root.querySelector<HTMLElement>('[data-slot="composer-model-trigger"]')!

    await step("Em repouso a lista NÃO existe no documento", async () => {
      // Não é uma lista escondida: é ausência. Uma lista presente e invisível
      // continuaria sendo lida, e prometeria uma escolha que não está à mão.
      await expect(panelOf(canvasElement)).toBeNull()
      await expect(trigger.getAttribute("aria-expanded")).toBe("false")
    })

    await step("E o gatilho não aponta lista nenhuma", async () => {
      // Apontar um endereço que não está no documento é prometer um elemento
      // que não existe.
      await expect(trigger.getAttribute("aria-controls")).toBeNull()
      await expect(trigger.textContent).toBe("Equilibrado")
    })
  },
}

export const Unavailable: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item4", "visual.item5"],
  },
  render: () => <StateExample value="fast" open />,
  play: async ({ canvasElement, step }) => {
    const panel = panelOf(canvasElement)!
    const blocked = everyModel().find((model) => !isModelSelectable(model))!
    const option = panel.querySelector<HTMLElement>(`[data-model-id="${blocked.id}"]`)!

    await step("A opção que não pode responder CONTINUA na lista", async () => {
      // Apagá-la levaria o motivo junto, e a pergunta "por que não posso?"
      // ficaria sem resposta na tela.
      await expect(option.getAttribute("aria-disabled")).toBe("true")
      await expect(panel.children).toHaveLength(everyModel().length)
    })

    await step("E o motivo está em TEXTO, dentro dela", async () => {
      // Quem não percebe o cinza não recebe nem a pista, então o cinza não
      // pode ser o único portador.
      const reason = option.querySelector<HTMLElement>('[data-slot="composer-model-reason"]')!
      await expect(reason.textContent).toBe(blocked.unavailableReason)
      await expect(option).toHaveTextContent(blocked.unavailableReason!)
    })

    await step("Confirmá-la não troca nada, e a lista continua aberta", async () => {
      // A decisão sai do vocabulário compartilhado, e não de um `if` da tela.
      onValueChange.mockClear()
      await expect(isModelSelectable(blocked)).toBe(false)
      await userEvent.click(option)
      await expect(onValueChange).not.toHaveBeenCalled()
      const stillOpen = panelOf(canvasElement)
      await expect(stillOpen).not.toBeNull()
      await expect(
        stillOpen!.querySelector('[aria-selected="true"]')!.getAttribute("data-model-id"),
      ).toBe("fast")
    })
  },
}
