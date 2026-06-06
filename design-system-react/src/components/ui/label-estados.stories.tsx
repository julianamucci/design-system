import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "UI/Label/Estados",
  tags: ["form"],
  component: Label,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Label: padrão, disabled (via peer-disabled ou group-data-[disabled=true]) e required (via span com aria-hidden).",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="estado-padrao">Nome completo</Label>
      <Input id="estado-padrao" placeholder="ex: João da Silva" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão. Texto com opacity total, font-medium, text-sm, leading-none. Herda cor do tema.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Nome completo");

    await step("Label está visível com opacity total", async () => {
      await expect(label).toBeVisible();
      await expect(label).not.toHaveClass("opacity-50");
    });

    await step("Label tem data-slot=label", async () => {
      await expect(label).toHaveAttribute("data-slot", "label");
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="estado-disabled">CPF</Label>
      <Input id="estado-disabled" disabled placeholder="000.000.000-00" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado disabled via peer-disabled. O Label aplica opacity-50 e cursor-not-allowed quando o Input irmão tem o atributo disabled. Label e Input devem ser siblings no DOM.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input está desabilitado", async () => {
      await expect(input).toBeDisabled();
    });
  },
};

export const DisabledViaGrupo: Story = {
  render: () => (
    <div className="group flex flex-col gap-1.5 w-64" data-disabled="true">
      <Label htmlFor="estado-grupo-disabled">Documento</Label>
      <Input id="estado-grupo-disabled" disabled placeholder="ex: 000.000.000-00" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado disabled via group-data-[disabled=true]. O Label aplica pointer-events-none e opacity-50 quando o container pai tem data-disabled=\"true\" e a classe group.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Documento");

    await step("Label está dentro de grupo disabled", async () => {
      await expect(label.closest("[data-disabled='true']")).toBeInTheDocument();
    });
  },
};

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="estado-required">
        Email profissional
        <span className="text-destructive" aria-hidden="true">*</span>
      </Label>
      <Input id="estado-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado required. O asterisco é adicionado pelo código consumidor como <span aria-hidden=\"true\">*</span> em text-destructive. O campo recebe aria-required=\"true\" para comunicar a obrigatoriedade via leitor de tela.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const asterisk = canvasElement.querySelector("[aria-hidden='true']");
    const input = canvas.getByRole("textbox");

    await step("Asterisco está visível com aria-hidden=true", async () => {
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk).toHaveAttribute("aria-hidden", "true");
    });

    await step("Input tem aria-required=true", async () => {
      await expect(input).toHaveAttribute("aria-required", "true");
    });
  },
};
