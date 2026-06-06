import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Bold, Italic, Eye } from "lucide-react";
import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle/Variantes",
  tags: ["form"],
  component: Toggle,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes visuais do Toggle: default (icon-only), outline (com borda) e com label visível.",
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Variante padrão (icon-only) — fundo transparente, hover muted. Exige aria-label descritivo da função.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle tem data-slot=toggle e aria-pressed inicial false", async () => {
      await expect(toggle).toHaveAttribute("data-slot", "toggle");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });
  },
};

export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Itálico">
      <Italic aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Variante outline — adiciona borda --input. Mantém a mesma lógica de aria-pressed e bg-muted no estado ativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Itálico" });

    await step("Toggle outline tem classe border", async () => {
      await expect(toggle.className).toContain("border");
    });
  },
};

export const WithLabel: Story = {
  render: () => (
    <Toggle aria-label="Mostrar ocultos">
      <Eye aria-hidden="true" />
      Mostrar ocultos
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Toggle com ícone + texto visível — útil para filtros de visualização como "Mostrar ocultos" ou "Visão compacta".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Texto visível do label está acessível", async () => {
      await expect(canvas.getByText("Mostrar ocultos")).toBeVisible();
    });
  },
};
