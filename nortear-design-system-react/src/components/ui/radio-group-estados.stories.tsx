import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "UI/RadioGroup/States",
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

/**
 * Razão de contraste da WCAG entre duas cores computadas opacas. Comparar nome
 * de token não responde a pergunta do critério — a razão responde.
 */
function razaoContraste(a: string, b: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, bl] = cor
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

export const Default: Story = {
  parameters: {
    covers: ["visual.item1", "accessibility.item2"],
    docs: {
      description: {
        story:
          "Nenhuma opção pré-selecionada: indicador interno ausente e aria-checked=\"false\" em todos. A borda usa --primary em qualquer estado.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="def-cartao" />
        <Label htmlFor="def-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
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

    await step("Borda contra fundo e rótulo contra fundo passam na WCAG", async () => {
      // 3:1 é o piso de componente de interface (1.4.11); 4.5:1 é o de texto
      // normal (1.4.3) — o rótulo tem 14px, não é texto grande.
      const estiloItem = getComputedStyle(radios[0]);
      await expect(
        razaoContraste(estiloItem.borderTopColor, estiloItem.backgroundColor),
      ).toBeGreaterThanOrEqual(3);

      const rotulo = canvas.getByText("Cartão de crédito");
      const fundoPagina = getComputedStyle(canvasElement.ownerDocument.body).backgroundColor;
      await expect(
        razaoContraste(getComputedStyle(rotulo).color, fundoPagina),
      ).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Checked: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Item com defaultValue selecionado: aria-checked=\"true\" e bolinha interna --primary visível, com animação curta de entrada.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento" defaultValue="pix">
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="ck-cartao" />
        <Label htmlFor="ck-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
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
    covers: ["functional.item4", "visual.item3"],
    docs: {
      description: {
        story:
          "Grupo inteiro desabilitado pela prop disabled na raiz e em cada item: item e rótulo a 50% de opacidade, cursor bloqueado, sem resposta a clique.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento" disabled>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="dis-cartao" disabled />
        <Label htmlFor="dis-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
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
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="idis-cartao" />
        <Label htmlFor="idis-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="pix" id="idis-pix" />
        <Label htmlFor="idis-pix">Pix</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
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
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\" no item: borda --destructive. Use junto com FormMessage para exibir a mensagem.",
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <RadioGroup aria-label="Forma de pagamento" aria-invalid="true">
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="inv-cartao" aria-invalid="true" />
          <Label htmlFor="inv-cartao">Cartão de crédito</Label>
        </div>
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="inv-pix" aria-invalid="true" />
          <Label htmlFor="inv-pix">Pix</Label>
        </div>
      </RadioGroup>
      <p className="nds-text-body nds-text-destructive">
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

export const FocusVisible: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Estado de foco por teclado: anel de 2px em --ring a 50% de opacidade, só em :focus-visible. Tab entra no grupo e as setas navegam.",
      },
    },
  },
  render: () => (
    <RadioGroup aria-label="Forma de pagamento">
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="foc-cartao" />
        <Label htmlFor="foc-cartao">Cartão de crédito</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="pix" id="foc-pix" />
        <Label htmlFor="foc-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Um Tab entra no grupo e para no primeiro item", async () => {
      // Tab de verdade, não `.focus()`: `:focus-visible` só casa quando o foco
      // chega por teclado, e é dele que sai o anel.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(radios[0]).toHaveFocus();
    });

    await step("O item focado por teclado desenha anel visível", async () => {
      // Afirma o efeito, não a classe: a asserção sobrevive a qualquer troca de
      // vocabulário no CSS e reprova se o anel sumir.
      const estilo = getComputedStyle(radios[0]);
      await expect(estilo.boxShadow !== "none" || estilo.outlineStyle !== "none").toBe(true);
    });
  },
};
