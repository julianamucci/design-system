import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { VALUE_STATES } from "@shared/testing/select-probe";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  selectWithLabelSource,
  selectControlledSource,
  formSelectSource,
  selectSource,
} from "./select.source";
import { Label } from "./label";
import { Button } from "./button";

const meta = {
  title: "Primitives/Form/Select/Compositions",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: selectSource },
      description: {
        component:
          "Composicoes do Select: controle reativo com useState, integração em formulário com submit e Select com Label externo associado.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  parameters: {
    docs: {
      // Estado controlado por useState — composição que o snippet do meta,
      // não controlado, esconderia.
      source: { transform: selectControlledSource },
      description: {
        story:
          "Versão controlada via useState. value + onValueChange refletem a seleção do usuário e podem ser persistidos ou validados externamente.",
      },
    },
  },
  render: () => {
    function ControlledSelect() {
      const [value, setValue] = useState<string>("");
      return (
        <div
          className="nds-stack" style={{minWidth: "280px", contain: "layout", minHeight: 160, position: "relative" }} data-spacing="md"
          
        >
          <Select
            value={value}
            items={VALUE_STATES}
            onValueChange={(v) => setValue((v ?? "") as string)}
          >
            <SelectTrigger aria-label="Selecionar estado">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
          <p className="nds-text-body" data-testid="ctrl-output">
            Selecionado: <span className="nds-font-mono">{value || "—"}</span>
          </p>
        </div>
      );
    }
    return <ControlledSelect />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Saída inicial é vazia (não pré-selecionado)", async () => {
      const output = canvas.getByTestId("ctrl-output");
      await expect(output).toHaveTextContent("—");
    });
    await step("Selecionar Rio de Janeiro atualiza estado controlado", async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const option = await waitForPortal("option", { name: "Rio de Janeiro" });
      await userEvent.click(option);
      const output = canvas.getByTestId("ctrl-output");
      await waitFor(async () => {
        // O estado externo recebe o VALOR…
        await expect(output).toHaveTextContent("rj");
        // …e o campo passa a exibir o RÓTULO correspondente.
        await expect(trigger).toHaveTextContent("Rio de Janeiro");
      });
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // Dentro de formulário, com Label e botão de envio: sub-composição.
      source: { transform: formSelectSource },
      description: {
        story:
          "Integração com <form>. Select recebe name para serializar no submit. Botão fica desabilitado até uma opção ser escolhida.",
      },
    },
  },
  render: () => {
    function FormSelect() {
      const [value, setValue] = useState<string>("");
      return (
        <form
          className="nds-stack" style={{minWidth: "280px", contain: "layout", minHeight: 200, position: "relative" }} data-spacing="md"

          onSubmit={(e) => e.preventDefault()}
        >
          <div className="nds-stack" data-spacing="sm">
            <Label htmlFor="form-state">Estado</Label>
            <Select
              name="state"
              value={value}
              items={{ ...VALUE_STATES, rs: "Rio Grande do Sul", sc: "Santa Catarina" }}
              onValueChange={(v) => setValue((v ?? "") as string)}
            >
              <SelectTrigger id="form-state" aria-label="Selecionar estado">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sudeste</SelectLabel>
                  <SelectItem value="sp">São Paulo</SelectItem>
                  <SelectItem value="rj">Rio de Janeiro</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Sul</SelectLabel>
                  <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                  <SelectItem value="sc">Santa Catarina</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!value}>
            Continuar
          </Button>
        </form>
      );
    }
    return <FormSelect />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const submitBtn = canvas.getByRole("button", { name: /Continuar/ });
    const trigger = canvas.getByRole("combobox");

    await step("Botão começa desabilitado (nada selecionado)", async () => {
      await expect(submitBtn).toBeDisabled();
    });

    await step("Selecionar opção habilita o botão", async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const option = await waitForPortal("option", { name: "São Paulo" });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(submitBtn).toBeEnabled();
      });
    });

    await step("O valor viaja no FormData do próprio formulário", async () => {
      // Ler o `FormData` do form real é o que prova a integração: o primitivo
      // mantém um campo escondido com `name`, e é ele que a serialização
      // nativa enxerga. Espiar um callback provaria só o clique.
      const form = canvasElement.querySelector("form") as HTMLFormElement;
      await waitFor(async () => {
        await expect(Object.fromEntries(new FormData(form).entries())).toEqual({
          state: "sp",
        });
      });
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      // O par Label + id no gatilho é o assunto, e o meta imprime o campo só
      // com aria-label.
      source: { transform: selectWithLabelSource },
      description: {
        story:
          "Select com Label externo associado via htmlFor/id. Quando há Label visível, o aria-label do trigger pode ser dispensado, mas o exemplo mantém ambos para acessibilidade redundante.",
      },
    },
  },
  render: () => {
    function LabeledSelect() {
      const [value, setValue] = useState<string>("");
      return (
        <div
          className="nds-stack" style={{minWidth: "280px", contain: "layout", minHeight: 140, position: "relative" }} data-spacing="sm"
          
        >
          <Label htmlFor="labeled-state">Estado de residência</Label>
          <Select
            value={value}
            items={{ ...VALUE_STATES, es: "Espírito Santo" }}
            onValueChange={(v) => setValue((v ?? "") as string)}
          >
            <SelectTrigger id="labeled-state" aria-label="Estado de residência">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
              <SelectItem value="es">Espírito Santo</SelectItem>
            </SelectContent>
          </Select>
          <p className="nds-text-caption nds-text-muted-foreground">
            Esse dado é usado apenas para cálculo de frete.
          </p>
        </div>
      );
    }
    return <LabeledSelect />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Label tem htmlFor associado ao trigger", async () => {
      const label = canvas.getByText("Estado de residência");
      await expect(label).toHaveAttribute("for", "labeled-state");
    });
    await step("Trigger tem id correspondente", async () => {
      const trigger = canvas.getByRole("combobox");
      await expect(trigger).toHaveAttribute("id", "labeled-state");
    });
  },
};
