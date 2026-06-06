import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator/Variantes",
  tags: ["layout"],
  component: Separator,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Separator — orientações horizontal e vertical. Não há variantes via cva(); o eixo da linha é controlado pela prop orientation.",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Aplica `h-px w-full` em layouts em block. Padrão para separar seções empilhadas.",
      },
    },
  },
  render: () => (
    <div className="w-64 space-y-4 text-sm">
      <div>Seção superior</div>
      <Separator orientation="horizontal" />
      <div>Seção inferior</div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const separator = canvasElement.querySelector(
      "[data-slot='separator']"
    ) as HTMLElement | null;
    await step("Tem data-orientation=horizontal", async () => {
      await expect(separator).toBeInTheDocument();
      await expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });
  },
};

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Aplica `w-px h-full self-stretch` em flex containers com altura definida.",
      },
    },
  },
  render: () => (
    <div className="flex items-center h-12 gap-4 text-sm">
      <span>Item esquerda</span>
      <Separator orientation="vertical" />
      <span>Item direita</span>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const separator = canvasElement.querySelector(
      "[data-slot='separator']"
    ) as HTMLElement | null;
    await step("Tem data-orientation=vertical", async () => {
      await expect(separator).toBeInTheDocument();
      await expect(separator).toHaveAttribute("data-orientation", "vertical");
    });
  },
};
