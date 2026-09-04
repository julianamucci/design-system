import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { TriggerComposerExample } from "./composer-trigger-popover.fixtures"
import {
  composerTriggerCommandsSource,
  composerTriggerMentionsSource,
} from "./composer-trigger-popover.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O painel é o mesmo; o que muda é ONDE o caractere abre a lista. As duas
// stories provam a regra pelo lado que importa: onde o gatilho NÃO vale.

const meta: Meta = {
  title: "Components/Conversational/ComposerTriggerPopover/Variants",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerTriggerMentionsSource },
      description: {
        component: "Onde cada caractere gatilho abre a lista — e onde ele não abre.",
      },
    },
  },
}

export default meta
type Story = StoryObj

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn()

const panelOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot="composer-trigger-popover"]')!

export const Mentions: Story = {
  parameters: {
    covers: ["functional.item2", "functional.item8", "accessibility.item4", "visual.item2"],
    docs: { source: { transform: composerTriggerMentionsSource } },
  },
  render: () => <TriggerComposerExample onSubmit={onSubmit} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const input = canvas.getByRole("textbox")
    const panel = () => panelOf(root)

    await step("No meio de uma palavra, nada abre", async () => {
      // A regra que justifica o primitivo existir: um endereço de e-mail não é
      // uma menção, e abrir o seletor ali interrompe quem está escrevendo o que
      // mais se escreve num campo de texto depois de texto.
      await userEvent.clear(input)
      input.focus()
      await userEvent.type(input, "contato@nortear")
      await expect(panel().hidden).toBe(true)
    })

    await step("Depois de um espaço, abre", async () => {
      await userEvent.clear(input)
      await userEvent.type(input, "avisa a @")
      await waitFor(() => expect(panel().hidden).toBe(false))
    })

    await step("Digitar filtra, e quem COMEÇA pelo termo vem antes", async () => {
      // Quem digita `an` quase sempre quer Ana, e não Joana — e `Ângela` prova
      // que o acento não esconde ninguém.
      await userEvent.type(input, "an")
      await waitFor(() =>
        expect(within(panel()).getAllByRole("option")).toHaveLength(3),
      )
      const names = [...panel().querySelectorAll(".nds-composer-trigger-option-label")]
        .map((el) => el.textContent)
      await expect(names).toEqual(["Ana Souza", "Ângela Reis", "Joana Lima"])
    })

    await step("A opção ativa carrega MARCAÇÃO, e não só cor", async () => {
      // Cor sozinha não descreve estado (1.4.1), e é a marcação que o leitor de
      // tela anuncia ao andar pela lista.
      const active = panel().querySelectorAll('[aria-selected="true"]')
      await expect(active).toHaveLength(1)
      await expect(active[0]).toHaveTextContent("Ana Souza")
    })
  },
}

export const Commands: Story = {
  parameters: {
    covers: ["functional.item9", "functional.item10", "visual.item3"],
    docs: { source: { transform: composerTriggerCommandsSource } },
  },
  render: () => <TriggerComposerExample command onSubmit={onSubmit} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const input = canvas.getByRole("textbox")
    const panel = () => panelOf(root)

    await step("No começo do campo, abre", async () => {
      await userEvent.clear(input)
      input.focus()
      await userEvent.type(input, "/")
      await waitFor(() => expect(panel().hidden).toBe(false))
      await expect(within(panel()).getAllByRole("option")).toHaveLength(2)
    })

    await step("Depois de texto, NÃO abre — ali o caractere é pontuação", async () => {
      await userEvent.clear(input)
      await userEvent.type(input, "veja isso /")
      await expect(panel().hidden).toBe(true)
    })

    await step("A escolha escreve o VALOR, e não o rótulo", async () => {
      // É o caso que o campo de valor existe para cobrir: a lista mostra
      // "Resumir a conversa" e o campo recebe a barra seguida do verbo.
      await userEvent.clear(input)
      await userEvent.type(input, "/res")
      await waitFor(() => expect(panel().hidden).toBe(false))
      await userEvent.keyboard("{Enter}")
      await waitFor(() => expect(input).toHaveValue("/resumir "))
    })
  },
}
