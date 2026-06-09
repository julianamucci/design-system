import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "UI/RadioGroup/Estados",
  tags: ["form"],
  component: RadioGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do RadioGroup: Default, Checked, Disabled (grupo e item), Invalid e Focus. Cada estado é controlado por atributos do RadioGroupItem.",
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Nenhuma opção pré-selecionada. Borda --input, indicador interno invisível, aria-checked=\"false\" em todos.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="def-cartao" />
        <Label htmlFor="def-cartao">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pix" id="def-pix" />
        <Label htmlFor="def-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Nenhum item está marcado por padrão", async () => {
      for (const r of radios) {
        await expect(r).toHaveAttribute("aria-checked", "false");
      }
    });
  },
};

export const Checked: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item com defaultValue selecionado. Borda e fundo --primary, bolinha interna --primary-foreground visível, aria-checked=\"true\".",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento" defaultValue="pix">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="ck-cartao" />
        <Label htmlFor="ck-cartao">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pix" id="ck-pix" />
        <Label htmlFor="ck-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pixRadio = canvas.getAllByRole("radio")[1];
    await step("Item Pix está marcado", async () => {
      await expect(pixRadio).toHaveAttribute("aria-checked", "true");
    });
    await step("Possui data-checked", async () => {
      await expect(pixRadio).toHaveAttribute("data-checked");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Grupo inteiro desabilitado via prop disabled na raiz e em cada item. opacity-50 e cursor-not-allowed; não responde a cliques.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="dis-cartao" disabled />
        <Label htmlFor="dis-cartao">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pix" id="dis-pix" disabled />
        <Label htmlFor="dis-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Cada item está desabilitado", async () => {
      for (const r of radios) {
        await expect(r).toHaveAttribute("aria-disabled", "true");
      }
    });
    await step("Clique não altera seleção quando disabled", async () => {
      const before = radios[0].getAttribute("aria-checked");
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0].getAttribute("aria-checked")).toBe(before);
    });
  },
};

export const ItemDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Apenas um item desabilitado (ex.: opção indisponível). Os demais permanecem interativos e seguem a navegação por setas.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="idis-cartao" />
        <Label htmlFor="idis-cartao">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pix" id="idis-pix" />
        <Label htmlFor="idis-pix">Pix</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="boleto" id="idis-boleto" disabled />
        <Label htmlFor="idis-boleto">Boleto bancário (indisponível)</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Apenas o item boleto está desabilitado", async () => {
      await expect(radios[0]).not.toHaveAttribute("aria-disabled", "true");
      await expect(radios[1]).not.toHaveAttribute("aria-disabled", "true");
      await expect(radios[2]).toHaveAttribute("aria-disabled", "true");
    });
  },
};

export const Invalid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\" no item. Borda --destructive e anel --destructive/20. Use junto com FormMessage para exibir mensagem.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <RadioGroup aria-label="Forma de pagamento" aria-invalid="true">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="inv-cartao" aria-invalid="true" />
          <Label htmlFor="inv-cartao">Cartão de crédito</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="pix" id="inv-pix" aria-invalid="true" />
          <Label htmlFor="inv-pix">Pix</Label>
        </div>
      </RadioGroup>
      <p className="text-sm text-destructive">
        Selecione uma forma de pagamento para continuar.
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Itens têm aria-invalid=true", async () => {
      for (const r of radios) {
        await expect(r).toHaveAttribute("aria-invalid", "true");
      }
    });
    await step("Mensagem de erro está visível", async () => {
      await expect(
        canvas.getByText(/Selecione uma forma de pagamento/),
      ).toBeVisible();
    });
  },
};

export const FocoVisivel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado de foco via teclado. Anel ring-3 ring-ring/50 com border-ring no item focado. Use Tab para entrar e setas para navegar.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="foc-cartao" />
        <Label htmlFor="foc-cartao">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pix" id="foc-pix" />
        <Label htmlFor="foc-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Primeiro item recebe foco programaticamente", async () => {
      radios[0].focus();
      await expect(radios[0]).toHaveFocus();
    });
  },
};
