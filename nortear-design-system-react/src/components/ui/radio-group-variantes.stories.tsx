import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "UI/RadioGroup/Variantes",
  tags: ["form"],
  component: RadioGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes de layout do RadioGroup: Vertical (padrão para 4+ opções), Horizontal (2–3 opções curtas) e WithDescription (cada item com texto auxiliar).",
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Empilhado — padrão. Cada par item+Label envolto em um div flex; grupo herda grid gap-2 do UI primitive.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="vert-cartao" />
        <Label htmlFor="vert-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="pix" id="vert-pix" />
        <Label htmlFor="vert-pix">Pix</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="boleto" id="vert-boleto" />
        <Label htmlFor="vert-boleto">Boleto bancário</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Grupo expõe role=radiogroup", async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toBeInTheDocument();
    });
    await step("Possui 3 itens radio", async () => {
      const radios = canvas.getAllByRole("radio");
      await expect(radios).toHaveLength(3);
    });
  },
};

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Inline — para 2–3 opções curtas. Sobrescreve o grid do root via flex gap-6 no className.",
      },
    },
  },
  render: () => (
    <RadioGroup
      className="nds-cluster" data-spacing="lg" style={{ flexWrap: "wrap" }}
      aria-label="Forma de entrega"
    >
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="padrao" id="horiz-padrao" />
        <Label htmlFor="horiz-padrao">Padrão</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="expressa" id="horiz-expressa" />
        <Label htmlFor="horiz-expressa">Expressa</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="retirar" id="horiz-retirar" />
        <Label htmlFor="horiz-retirar">Retirar</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Grupo usa flex (sem orientation explícita)", async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toHaveClass("nds-cluster");
    });
    await step("Possui 3 itens com Labels associados", async () => {
      const radios = canvas.getAllByRole("radio");
      await expect(radios).toHaveLength(3);
      await expect(canvas.getByText("Expressa")).toBeVisible();
    });
  },
};

export const WithDescription: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Cada item com Label + descrição auxiliar abaixo. Use flex items-start para alinhar o radio com a primeira linha do texto.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de entrega" className="nds-max-w-md">
      <div className="nds-cluster" data-align="start" data-spacing="sm">
        <RadioGroupItem value="padrao" id="desc-padrao" className="nds-mt-0-5" />
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="desc-padrao">Padrão</Label>
          <p className="nds-text-body">
            Entrega em até 5 dias úteis. Frete grátis acima de R$ 99.
          </p>
        </div>
      </div>
      <div className="nds-cluster" data-align="start" data-spacing="sm">
        <RadioGroupItem value="expressa" id="desc-expressa" className="nds-mt-0-5" />
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="desc-expressa">Expressa</Label>
          <p className="nds-text-body">
            Entrega em 1 dia útil. Custo adicional de R$ 19,90.
          </p>
        </div>
      </div>
      <div className="nds-cluster" data-align="start" data-spacing="sm">
        <RadioGroupItem value="retirar" id="desc-retirar" className="nds-mt-0-5" />
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="desc-retirar">Retirar na loja</Label>
          <p className="nds-text-body">
            Disponível em 2 horas após confirmação do pagamento.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Cada Label tem htmlFor associado ao id do item", async () => {
      const padraoLabel = canvas.getByText("Padrão");
      await expect(padraoLabel).toHaveAttribute("for", "desc-padrao");
    });
    await step("Descrições auxiliares estão presentes", async () => {
      await expect(
        canvas.getByText(/Entrega em até 5 dias úteis/),
      ).toBeVisible();
    });
  },
};
