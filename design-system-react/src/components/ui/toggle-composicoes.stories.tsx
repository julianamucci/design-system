import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Bold, Italic, Underline, List, Eye } from "lucide-react";
import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle/Composicoes",
  tags: ["form"],
  component: Toggle,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Toggle: barra de formatação, filtro com label, tamanhos lado a lado e controle controlado.",
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarraDeFormatacao: Story = {
  render: () => (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Itálico">
        <Italic aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Sublinhado">
        <Underline aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Lista">
        <List aria-hidden="true" />
      </Toggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Barra de formatação com 4 Toggles independentes (cada um alterna isoladamente). Cada Toggle exige aria-label próprio.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Quatro Toggles independentes estão visíveis", async () => {
      const toggles = canvas.getAllByRole("button");
      await expect(toggles).toHaveLength(4);
    });

    await step("aria-label é único em cada Toggle", async () => {
      await expect(canvas.getByRole("button", { name: "Negrito" })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Itálico" })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Sublinhado" })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Lista" })).toBeInTheDocument();
    });
  },
};

export const FiltroComLabel: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Mostrar ocultos">
      <Eye aria-hidden="true" />
      Mostrar ocultos
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Filtro de visualização com ícone Eye + texto "Mostrar ocultos". Variante outline destaca o filtro como controle persistente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: /Mostrar ocultos/i });

    await step("Filtro alterna ao clicar", async () => {
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  },
};

export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle size="sm" aria-label="Negrito pequeno">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle size="default" aria-label="Negrito padrão">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle size="lg" aria-label="Negrito grande">
        <Bold aria-hidden="true" />
      </Toggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Três tamanhos lado a lado — sm, default e lg via tokens --height-sm/--height-default/--height-lg.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Três Toggles com tamanhos distintos", async () => {
      const toggles = canvas.getAllByRole("button");
      await expect(toggles).toHaveLength(3);
    });
  },
};

export const Controlado: Story = {
  render: function ControladoRender() {
    const [isBold, setIsBold] = useState(false);
    return (
      <div className="flex flex-col items-start gap-3 w-72">
        <Toggle pressed={isBold} onPressedChange={setIsBold} aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <p className="text-xs text-muted-foreground">
          Estado atual: <code className="font-mono">{String(isBold)}</code>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Toggle controlado via useState — o componente pai mantém o estado e atualiza via onPressedChange.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Estado inicial é false", async () => {
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await expect(canvas.getByText("false")).toBeVisible();
    });

    await step("Clique reflete no estado controlado", async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(canvas.getByText("true")).toBeVisible();
    });
  },
};
