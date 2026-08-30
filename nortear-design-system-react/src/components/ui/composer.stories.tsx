import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Composer, type ComposerProps } from "./composer"
import { composerLabels, useComposerLabels } from "./composer.fixtures"
import { composerSource } from "./composer.source"
import { ComposerDocs } from "@/components/docs/ComposerDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn()

/** Os rótulos vêm de hook, então o render passa por um componente. */
function PlaygroundExample(args: Partial<ComposerProps>) {
  return (
    <Composer
      {...args}
      labels={useComposerLabels()}
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}

const meta = {
  title: "Primitives/Conversational/Composer",
  component: Composer,
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(ComposerDocs),
      // O gerador imprimiria a árvore do render da story, com o andaime que só
      // existe no arquivo. A transform devolve o uso real.
      source: { transform: composerSource },
    },
  },
  argTypes: {
    value: {
      control: "text",
      description:
        "Texto do campo. Sozinho é semente; com o retorno de mudança, é quem consome que manda.",
      table: { type: { summary: "string" }, defaultValue: { summary: "''" } },
    },
    rows: {
      control: { type: "number", min: 1, max: 8 },
      description: "Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte.",
      table: { type: { summary: "number" }, defaultValue: { summary: "2" } },
    },
    maxLength: {
      control: { type: "number", min: 20, max: 4000, step: 20 },
      description: "Limite de caracteres. Sem ele não há contador.",
      table: { type: { summary: "number" } },
    },
    submitOn: {
      control: "inline-radio",
      options: ["enter", "modifier"],
      description: "Qual combinação envia. A dica embaixo do campo muda junto.",
      table: { type: { summary: "'enter' | 'modifier'" }, defaultValue: { summary: "'enter'" } },
    },
    running: {
      control: "boolean",
      description: "Se a resposta está sendo gerada. É quem consome que sabe.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Indisponibiliza o conjunto inteiro.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    labels: {
      control: false,
      description:
        "O texto da interface: nome do campo, marca-lugar, os dois nomes do botão, a dica e o limite.",
      table: { type: { summary: "ComposerLabels" } },
    },
    railStart: {
      control: false,
      description: "Controles do início do trilho. É um espaço, e não uma lista fixa.",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      control: false,
      description: "Classes extras na raiz. É por aqui que a página define a largura.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    labels: {} as never,
    value: "",
    rows: 2,
    maxLength: 500,
    submitOn: "enter",
    running: false,
    disabled: false,
  },
} satisfies Meta<typeof Composer>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item6", "functional.item9",
      "accessibility.item1", "accessibility.item2", "accessibility.item6",
      "visual.item1",
    ],
  },
  render: (args) => <PlaygroundExample {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const input = canvas.getByRole("textbox")
    const labels = composerLabels()
    const submitButton = () => canvas.getByRole("button", { name: labels.submit })

    await step("O campo tem nome próprio, e não depende do marca-lugar", async () => {
      // O marca-lugar some na primeira letra digitada. Um campo cujo nome era
      // o marca-lugar fica sem nome exatamente quando passa a ter conteúdo.
      await expect(input).toHaveAccessibleName(labels.input)
    })

    await step("A dica e o limite descrevem o campo", async () => {
      // Saber que uma tecla envia DEPOIS de tê-la apertado não serve para nada.
      await expect(input).toHaveAccessibleDescription(/enter/i)
      await expect(input).toHaveAccessibleDescription(/500/)
    })

    await step("Com o campo vazio, o envio está desabilitado", async () => {
      // O passo estabelece a própria precondição: a play reexecuta no mesmo DOM.
      await userEvent.clear(input)
      await waitFor(() => expect(submitButton()).toBeDisabled())
    })

    await step("Digitar habilita o envio", async () => {
      await userEvent.type(input, "bom dia")
      await waitFor(() => expect(submitButton()).toBeEnabled())
    })

    await step("O foco acende o anel no CONJUNTO, e não só em volta do texto", async () => {
      // O trilho está dentro do mesmo formulário: um anel só no texto o
      // deixaria de fora do que está em foco.
      const field = root.querySelector<HTMLElement>(".nds-composer-field")!
      input.focus()
      await expect(field.matches(":focus-within")).toBe(true)
    })

    await step("Clicar no botão de envio emite o texto uma vez", async () => {
      onSubmit.mockClear()
      await userEvent.click(submitButton())
      await expect(onSubmit).toHaveBeenCalledTimes(1)
      await expect(onSubmit).toHaveBeenCalledWith("bom dia")
    })

    await step("E o campo continua com o texto — limpar é de quem recebe", async () => {
      // É a decisão que separa o componente do produto: limpar cedo perde a
      // mensagem quando o envio falha, e só quem recebe sabe se ela saiu.
      await expect(input).toHaveValue("bom dia")
    })
  },
}
