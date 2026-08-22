import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import {
  radioGroupComDescricaoSource,
  radioGroupHorizontalSource,
  radioGroupSource,
} from "./radio-group.source";

const meta = {
  title: "UI/RadioGroup/Variants",
  tags: ["form"],
  component: RadioGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: radioGroupSource },
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
          "Empilhado — padrão do grupo. Cada par item+Label vai num .nds-cluster; o ritmo vertical vem do próprio .nds-radio-group.",
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
      // `aria-orientation` está afirmado no `render`; nenhum control o descreve.
      source: { transform: radioGroupHorizontalSource },
      description: {
        story:
          "Em linha — para 2–3 opções curtas. Sai de aria-orientation=\"horizontal\" no grupo: o mesmo atributo anuncia a direção das setas e dispõe as opções lado a lado.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-orientation="horizontal" aria-label="Forma de entrega">
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
    await step("O grupo anuncia a orientação horizontal", async () => {
      await expect(canvas.getByRole("radiogroup")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      );
    });
    await step("As três opções ficam na mesma linha", async () => {
      // Sem esta asserção o atributo poderia estar certo e o layout continuar
      // empilhado — foi assim que a versão em classe morta passou despercebida.
      const topos = new Set(
        canvas.getAllByRole("radio").map((el) => Math.round(el.getBoundingClientRect().top)),
      );
      await expect(topos.size).toBe(1);
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
      // Sub-composição: o texto auxiliar e o alinhamento do item ao topo não
      // cabem no par item + rótulo que o meta imprime.
      source: { transform: radioGroupComDescricaoSource },
      description: {
        story:
          "Cada item com Label + descrição auxiliar abaixo, ligada ao controle por aria-describedby. O .nds-cluster com data-align=\"start\" alinha o rádio à primeira linha do texto.",
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
      const defaultLabel = canvas.getByText("Padrão");
      await expect(defaultLabel).toHaveAttribute("for", "desc-padrao");
    });
    await step("Descrições auxiliares estão presentes", async () => {
      await expect(
        canvas.getByText(/Entrega em até 5 dias úteis/),
      ).toBeVisible();
    });
  },
};
