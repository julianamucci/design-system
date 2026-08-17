import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Label } from "./label";
import { Input } from "./input";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Label/Compositions",
  tags: ["form"],
  component: Label,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composições do rótulo com outros elementos de formulário: campo de texto, caixa de seleção e campo obrigatório.",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Par clássico rótulo + campo. O `for` do rótulo corresponde ao `id` do campo, e é isso que faz o clique no texto focar o campo.",
      },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
      <Label htmlFor="comp-input">Telefone</Label>
      <Input id="comp-input" type="tel" placeholder="(11) 99999-9999" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Telefone");
    const input = canvasElement.querySelector<HTMLInputElement>("#comp-input")!;

    await step("O campo é alcançável pelo texto do rótulo", async () => {
      await expect(canvas.getByLabelText("Telefone")).toBe(input);
    });

    await step("Clicar no rótulo move o foco para o campo", async () => {
      input.blur();
      await expect(input).not.toHaveFocus();
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};

export const WithCheckbox: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Rótulo associado a uma caixa de seleção. Clicar no texto alterna a caixa — é o alcance de clique que a associação entrega.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="comp-checkbox" />
      <Label htmlFor="comp-checkbox">Concordo com os termos de uso</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Concordo com os termos de uso");
    const checkbox = canvas.getByRole("checkbox");

    await step("A caixa recebe o nome acessível do rótulo", async () => {
      await expect(checkbox).toHaveAccessibleName("Concordo com os termos de uso");
    });

    await step("Clicar no rótulo foca a caixa E alterna o estado", async () => {
      // Par idempotente: o painel Interactions reexecuta no mesmo DOM, e sem
      // desmarcar antes a segunda rodada partiria de "marcada" e inverteria o
      // resultado.
      if (checkbox.getAttribute("aria-checked") === "true") await userEvent.click(label);
      await expect(checkbox).not.toBeChecked();
      // O foco é o segundo eixo, e é o que nenhuma das cinco stacks verificava:
      // `for` só alcança controle rotulável, e sem isso o rótulo não leva o foco.
      checkbox.blur();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.click(label);
      await expect(checkbox).toHaveFocus();
      await expect(checkbox).toBeChecked();
    });
  },
};

export const RequiredField: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Campo obrigatório: asterisco decorativo no rótulo e `aria-required` no campo. As duas partes são necessárias — uma é visual, a outra é semântica.",
      },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
      <Label htmlFor="comp-required">
        Email profissional
        <span className="nds-text-destructive" aria-hidden="true">*</span>
      </Label>
      <Input
        id="comp-required"
        type="email"
        aria-required="true"
        placeholder="ex: joao@empresa.com"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    const marcador = canvasElement.querySelector<HTMLElement>(".nds-text-destructive")!;

    await step("O asterisco é decorativo", async () => {
      await expect(marcador).toHaveAttribute("aria-hidden", "true");
      await expect(marcador).toHaveTextContent("*");
    });

    await step("O nome acessível do campo não carrega o asterisco", async () => {
      // É o que `aria-hidden` no marcador compra: o leitor anuncia o rótulo, e
      // a obrigatoriedade vem do `aria-required`, não de um "asterisco" falado.
      await expect(input).toHaveAccessibleName("Email profissional");
      await expect(input).toHaveAttribute("aria-required", "true");
    });
  },
};
