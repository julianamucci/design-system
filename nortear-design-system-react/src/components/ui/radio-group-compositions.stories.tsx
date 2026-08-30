import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { Button } from "./button";
import {
  radioGroupCartoesSource,
  radioGroupControlledSource,
  formRadioGroupSource,
  radioGroupSource,
} from "./radio-group.source";

const meta = {
  title: "Primitives/Form/RadioGroup/Compositions",
  tags: ["form"],
  component: RadioGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: radioGroupSource },
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
      // Sub-composição com `useState`: o par value + onValueChange é o assunto.
      source: { transform: radioGroupControlledSource },
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
        <div className="nds-stack" style={{ minWidth: "280px" }} data-spacing="md">
          <RadioGroup
            value={value}
            onValueChange={setValue}
            aria-label="Forma de pagamento"
          >
            <div className="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="cartao" id="ctrl-cartao" />
              <Label htmlFor="ctrl-cartao">Cartão de crédito</Label>
            </div>
            <div className="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="pix" id="ctrl-pix" />
              <Label htmlFor="ctrl-pix">Pix</Label>
            </div>
            <div className="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="boleto" id="ctrl-boleto" />
              <Label htmlFor="ctrl-boleto">Boleto bancário</Label>
            </div>
          </RadioGroup>
          <p className="nds-text-body" data-testid="ctrl-output">
            Selecionado: <span className="nds-font-mono">{value || "—"}</span>
          </p>
        </div>
      );
    }
    return <ControlledRadio />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    // A saída vazia é asserção de MONTAGEM e mora em `States/Default`, que não
    // interage: aqui nenhum replay voltaria a alcançá-la.
    await step("Clicar em Pix atualiza o estado controlado", async () => {
      await userEvent.click(radios[1]);
      const output = canvas.getByTestId("ctrl-output");
      await expect(output).toHaveTextContent("pix");
    });
    await step("Trocar a escolha atualiza a saída de novo", async () => {
      // Segunda rodada com valor diferente: prova que o estado ACOMPANHA a
      // seleção, e não que foi preenchido uma vez.
      await userEvent.click(radios[0]);
      const output = canvas.getByTestId("ctrl-output");
      await expect(output).toHaveTextContent("cartao");
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // Sub-composição dentro de <form>, com botão preso à escolha.
      source: { transform: formRadioGroupSource },
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
          className="nds-stack" style={{ minWidth: "280px" }} data-spacing="md"
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
            <div className="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="cartao" id="form-cartao" />
              <Label htmlFor="form-cartao">Cartão de crédito</Label>
            </div>
            <div className="nds-cluster" data-spacing="sm">
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

    // O botão desabilitado sem escolha é asserção de MONTAGEM: depois do
    // primeiro clique nenhum replay volta a ele.
    await step("Selecionar item habilita o botão", async () => {
      const cartao = canvas.getByRole("radio", { name: "Cartão de crédito" });
      // Idempotente: no replay o item já está marcado e o clique é dispensado.
      if (cartao.getAttribute("aria-checked") !== "true") await userEvent.click(cartao);
      await expect(cartao).toHaveAttribute("aria-checked", "true");
      await expect(submitBtn).toBeEnabled();
    });

    await step("O valor escolhido chega ao FormData no submit", async () => {
      // Sem esta leitura o passo só provava que o submit não recarrega a
      // página; o que interessa é o rádio participar do formulário.
      const form = canvasElement.querySelector("form")!;
      await userEvent.click(submitBtn);
      await expect(new FormData(form).get("payment")).toBe("cartao");
    });
  },
};

export const CardSelection: Story = {
  parameters: {
    docs: {
      // Sub-composição em cartões: o rótulo envolve o cartão inteiro.
      source: { transform: radioGroupCartoesSource },
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
          className="nds-grid nds-sm-grid-3" style={{ minWidth: "480px" }} data-spacing="sm"
        >
          {options.map((opt) => (
            // `.nds-radio-card` faz o cartão inteiro reagir à escolha, por
            // `:has()` sobre o `aria-checked` do item de dentro. As classes de
            // seletor-pai do framework utilitário que estavam aqui não existem
            // mais no CSS: todos os cartões ficavam idênticos, escolhido ou não.
            <Label
              key={opt.value}
              htmlFor={`card-${opt.value}`}
              className="nds-radio-card nds-stack" data-align="start" data-spacing="xs"
            >
              <div className="nds-cluster nds-w-full" data-align="center" data-justify="between">
                <span className="nds-text-body nds-font-medium">{opt.title}</span>
                <RadioGroupItem value={opt.value} id={`card-${opt.value}`} />
              </div>
              <p className="nds-text-caption nds-text-muted-foreground nds-font-normal">
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

    await step("O cartão escolhido muda de aparência", async () => {
      // A razão de existir da composição. Enquanto o destaque saía de classe
      // morta, os três cartões ficavam idênticos e nenhuma asserção reprovava:
      // a play só olhava o aria-checked do rádio de dentro.
      const cartoes = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(".nds-radio-card"),
      );
      const escolhido = cartoes.find((c) =>
        c.querySelector('[role="radio"][aria-checked="true"]'),
      )!;
      const other = cartoes.find((c) => c !== escolhido)!;
      // `waitFor`: a borda e o fundo trocam com transição, e no meio dela a cor
      // computada ainda é a antiga.
      await waitFor(async () => {
        await expect(getComputedStyle(escolhido).borderTopColor).not.toBe(
          getComputedStyle(other).borderTopColor,
        );
        await expect(getComputedStyle(escolhido).backgroundColor).not.toBe(
          getComputedStyle(other).backgroundColor,
        );
      });
    });
  },
};
