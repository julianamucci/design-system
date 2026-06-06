import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "UI/ToggleGroup/Variantes",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do ToggleGroup: single (seleção exclusiva), multiple (combinação) e vertical (items empilhados).",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => (
    <ToggleGroup defaultValue={["center"]} aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'type="single" — seleção exclusiva (apenas um item ativo). value é uma string. Ideal para alinhamento de texto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole("button", { name: "Centralizar" });
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });

    await step("Apenas 1 item ativo (defaultValue='center')", async () => {
      await expect(center).toHaveAttribute("aria-pressed", "true");
      await expect(left).toHaveAttribute("aria-pressed", "false");
    });

    await step("aria-label do grupo presente", async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group).toHaveAttribute("aria-label", "Alinhamento do texto");
    });
  },
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup defaultValue={["bold", "italic"]} aria-label="Formatação">
      <ToggleGroupItem value="bold" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Itálico">
        <Italic aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Sublinhado">
        <Underline aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'type="multiple" — seleção combinada (vários items podem estar ativos). value é array de strings. Ideal para formatação Bold/Italic/Underline.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Negrito" });
    const italic = canvas.getByRole("button", { name: "Itálico" });
    const underline = canvas.getByRole("button", { name: "Sublinhado" });

    await step("Dois items ativos simultaneamente (multiple)", async () => {
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      await expect(italic).toHaveAttribute("aria-pressed", "true");
      await expect(underline).toHaveAttribute("aria-pressed", "false");
    });
  },
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      orientation="vertical"
      defaultValue={["grid"]}
      aria-label="Modo de visualização"
    >
      <ToggleGroupItem value="grid" aria-label="Grade">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Lista">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'orientation="vertical" — items empilhados. Navegação via ArrowUp/ArrowDown. Útil para sidebars com modos de visualização.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Grupo tem data-orientation=vertical", async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group).toHaveAttribute("data-orientation", "vertical");
    });

    await step("Dois items visíveis com aria-label próprio", async () => {
      await expect(canvas.getByRole("button", { name: "Grade" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Lista" })).toBeVisible();
    });
  },
};
