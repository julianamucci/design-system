import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Composer } from "./composer"
import { useComposerLabels } from "./composer.fixtures"
import {
  commandSource,
  mentionSource,
  useTriggerLabels,
} from "./composer-trigger-popover.fixtures"
import { composerTriggerSource } from "./composer-trigger-popover.source"
import { ComposerTriggerPopoverDocs } from "@/components/docs/ComposerTriggerPopoverDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn()

type Args = { mention: boolean; command: boolean }

/** Os rótulos vêm de hook, então o render passa por um componente. */
function PlaygroundExample({ mention, command }: Args) {
  return (
    <Composer
      labels={useComposerLabels()}
      triggerLabels={useTriggerLabels()}
      triggers={[
        ...(mention ? [mentionSource()] : []),
        ...(command ? [commandSource()] : []),
      ]}
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}

const meta: Meta<Args> = {
  title: "UI/ComposerTriggerPopover",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(ComposerTriggerPopoverDocs),
      // O gerador imprimiria a árvore do render da story, com o andaime que só
      // existe no arquivo. A transform devolve o uso real.
      source: { transform: composerTriggerSource },
    },
  },
  argTypes: {
    mention: {
      control: "boolean",
      description: "O gatilho de menção, que vale em começo de qualquer palavra.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    command: {
      control: "boolean",
      description: "O gatilho de comando, que vale só na primeira posição do campo.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
  },
  args: { mention: true, command: true },
}

export default meta
type Story = StoryObj<Args>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "visual.item1",
    ],
  },
  render: (args) => <PlaygroundExample {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const input = canvas.getByRole("textbox")
    const panel = () =>
      root.querySelector<HTMLElement>('[data-slot="composer-trigger-popover"]')!

    await step("Fechado, o campo é um campo de texto comum", async () => {
      // O passo estabelece a própria precondição: a play reexecuta no mesmo DOM.
      await userEvent.clear(input)
      await expect(panel().hidden).toBe(true)
      // Fechado, o campo não aponta lista nenhuma: um `aria-controls` para um
      // painel escondido promete uma lista que não há.
      await expect(input).not.toHaveAttribute("aria-controls")
      await expect(input).not.toHaveAttribute("aria-activedescendant")
    })

    await step("Digitar o gatilho abre a lista INTEIRA", async () => {
      // Abrir filtrado seria pedir que a pessoa adivinhasse o que existe.
      input.focus()
      await userEvent.type(input, "@")
      await waitFor(() => expect(panel().hidden).toBe(false))
      await expect(within(panel()).getAllByRole("option")).toHaveLength(4)
    })

    await step("E o campo passa a APONTAR a lista", async () => {
      // Sem virar caixa de combinação: a especificação de ARIA em HTML não
      // admite esse papel num campo de várias linhas, e o axe reprova. O que a
      // caixa de texto admite — e resolve o problema — é apontar.
      await expect(input).toHaveAttribute("aria-controls", panel().id)
      await expect(input).not.toHaveAttribute("role")
    })

    await step("O foco continua no CAMPO, e a opção ativa é apontada", async () => {
      // É o que separa este padrão de um menu: mover o foco para a lista faria
      // a próxima letra digitada não chegar ao texto.
      await expect(input).toHaveFocus()
      const active = panel().querySelector<HTMLElement>('[aria-selected="true"]')!
      await expect(input).toHaveAttribute("aria-activedescendant", active.id)
    })
  },
}
