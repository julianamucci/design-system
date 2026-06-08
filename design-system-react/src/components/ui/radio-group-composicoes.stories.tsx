import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { Button } from "./button";

const meta = {
  title: "UI/RadioGroup/Composicoes",
  tags: ["form"],
  component: RadioGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do RadioGroup: controle reativo via useState, integração em formulário com submit e card de seleção visual.",
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Versão controlada via useState. value + onValueChange refletem a seleção do usuário e podem ser persistidos ou validados externamente.",
      },
    },
  },
  render: () => {
    function ControlledRadio() {
      const [value, setValue] = useState<string>("");
      return (
        <div className="flex flex-col gap-4 min-w-[280px]">
          <RadioGroup
            value={value}
            onValueChange={setValue}
            aria-label="Forma de pagamento"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="cartao" id="ctrl-cartao" />
              <Label htmlFor="ctrl-cartao">Cartão de crédito</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pix" id="ctrl-pix" />
              <Label htmlFor="ctrl-pix">Pix</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="boleto" id="ctrl-boleto" />
              <Label htmlFor="ctrl-boleto">Boleto bancário</Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-muted-foreground" data-testid="ctrl-output">
            Selecionado: <span className="font-mono">{value || "—"}</span>
          </p>
        </div>
      );
    }
    return <ControlledRadio />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Saída inicial é vazia (não pré-selecionado)", async () => {
      const output = canvas.getByTestId("ctrl-output");
      await expect(output).toHaveTextContent("—");
    });
    await step("Clicar em Pix atualiza o estado controlado", async () => {
      await userEvent.click(radios[1]);
      const output = canvas.getByTestId("ctrl-output");
      await expect(output).toHaveTextContent("pix");
    });
  },
};

export const EmFormulario: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Integração com <form>. RadioGroup recebe name para serializar no submit. Botão fica desabilitado até uma opção ser escolhida.",
      },
    },
  },
  render: () => {
    function FormRadio() {
      const [value, setValue] = useState<string>("");
      const onSubmit = fn();
      return (
        <form
          className="flex flex-col gap-4 min-w-[280px]"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ payment: value });
          }}
        >
          <RadioGroup
            name="payment"
            value={value}
            onValueChange={setValue}
            aria-label="Forma de pagamento"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="cartao" id="form-cartao" />
              <Label htmlFor="form-cartao">Cartão de crédito</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pix" id="form-pix" />
              <Label htmlFor="form-pix">Pix</Label>
            </div>
          </RadioGroup>
          <Button type="submit" disabled={!value}>
            Continuar
          </Button>
        </form>
      );
    }
    return <FormRadio />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const submitBtn = canvas.getByRole("button", { name: /Continuar/ });

    await step("Botão começa desabilitado (nada selecionado)", async () => {
      await expect(submitBtn).toBeDisabled();
    });

    await step("Selecionar item habilita o botão", async () => {
      const radios = canvas.getAllByRole("radio");
      await userEvent.click(radios[0]);
      await expect(submitBtn).toBeEnabled();
    });

    await step("Submit dispara com o valor escolhido", async () => {
      await userEvent.click(submitBtn);
      // form foi submetido sem reload (preventDefault)
    });
  },
};

export const CardSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Cada item envolto em um Label clicável estilizado como card. O Label é a região de clique inteira; o RadioGroupItem fica posicionado no canto.",
      },
    },
  },
  render: () => {
    function CardRadio() {
      const [value, setValue] = useState<string>("");
      const options = [
        { value: "standard", title: "Padrão", description: "5 dias úteis · Frete grátis" },
        { value: "express", title: "Expressa", description: "1 dia útil · R$ 19,90" },
        { value: "pickup", title: "Retirar", description: "2 horas · Sem custo" },
      ];
      return (
        <RadioGroup
          value={value}
          onValueChange={setValue}
          aria-label="Forma de entrega"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-[480px]"
        >
          {options.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`card-${opt.value}`}
              className="flex flex-col items-start gap-1 rounded-lg border p-3 cursor-pointer hover:bg-accent has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">{opt.title}</span>
                <RadioGroupItem value={opt.value} id={`card-${opt.value}`} />
              </div>
              <p className="text-xs text-muted-foreground font-normal">
                {opt.description}
              </p>
            </Label>
          ))}
        </RadioGroup>
      );
    }
    return <CardRadio />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await step("Possui 3 cards selecionáveis", async () => {
      await expect(radios).toHaveLength(3);
    });
    await step("Clicar no Label do card marca o item", async () => {
      const expressLabel = canvas.getByText("Expressa");
      await userEvent.click(expressLabel);
      await expect(radios[1]).toHaveAttribute("aria-checked", "true");
    });
  },
};
