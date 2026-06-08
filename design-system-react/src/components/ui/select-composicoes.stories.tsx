import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, screen, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
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
import { Label } from "./label";
import { Button } from "./button";

const meta = {
  title: "UI/Select/Composicoes",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
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
          className="flex flex-col gap-4 min-w-[280px]"
          style={{ contain: "layout", minHeight: 160, position: "relative" }}
        >
          <Select value={value} onValueChange={(v) => setValue(v ?? "")}>
            <SelectTrigger aria-label="Selecionar estado">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground" data-testid="ctrl-output">
            Selecionado: <span className="font-mono">{value || "—"}</span>
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
      await userEvent.click(trigger);
      const option = await waitForPortal("option", { name: "Rio de Janeiro" });
      await userEvent.click(option);
      const output = canvas.getByTestId("ctrl-output");
      await waitFor(async () => {
        await expect(output).toHaveTextContent("rj");
      });
    });
  },
};

export const EmFormulario: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Integração com <form>. Select recebe name para serializar no submit. Botão fica desabilitado até uma opção ser escolhida.",
      },
    },
  },
  render: () => {
    function FormSelect() {
      const [value, setValue] = useState<string>("");
      const onSubmit = fn();
      return (
        <form
          className="flex flex-col gap-4 min-w-[280px]"
          style={{ contain: "layout", minHeight: 200, position: "relative" }}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ state: value });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-state">Estado</Label>
            <Select name="state" value={value} onValueChange={(v) => setValue(v ?? "")}>
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
      await userEvent.click(trigger);
      const option = await waitForPortal("option", { name: "São Paulo" });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(submitBtn).toBeEnabled();
      });
    });

    await step("Submit dispara com o valor escolhido", async () => {
      await userEvent.click(submitBtn);
      // form submetido sem reload (preventDefault)
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    docs: {
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
          className="flex flex-col gap-2 min-w-[280px]"
          style={{ contain: "layout", minHeight: 140, position: "relative" }}
        >
          <Label htmlFor="labeled-state">Estado de residência</Label>
          <Select value={value} onValueChange={(v) => setValue(v ?? "")}>
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
          <p className="text-xs text-muted-foreground">
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
