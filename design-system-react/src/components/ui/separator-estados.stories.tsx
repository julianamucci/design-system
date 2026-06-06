import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator/Estados",
  tags: ["layout"],
  component: Separator,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Separator: Decorativo (padrão, aria-hidden) e Semântico (anuncia como separator para leitores de tela).",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorativo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`decorative={true}` (padrão) — aplica `role=\"none\"` e `aria-hidden=\"true\"`. Ignorado por leitores de tela.",
      },
    },
  },
  render: () => (
    <div className="w-64 space-y-4 text-sm">
      <div>Item 1</div>
      <Separator orientation="horizontal" decorative={true} />
      <div>Item 2</div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const separator = canvasElement.querySelector(
      "[data-slot='separator']"
    ) as HTMLElement | null;
    await step("role=none e aria-hidden quando decorative=true", async () => {
      await expect(separator).toBeInTheDocument();
      await expect(separator).toHaveAttribute("role", "none");
      await expect(separator).toHaveAttribute("aria-hidden", "true");
    });
  },
};

export const Semantico: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`decorative={false}` — aplica `role=\"separator\"` e `aria-orientation`. Anuncia a separação para leitores de tela.",
      },
    },
  },
  render: () => (
    <div className="w-64 space-y-4 text-sm">
      <div>Grupo A</div>
      <Separator orientation="horizontal" decorative={false} />
      <div>Grupo B</div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const separator = canvasElement.querySelector(
      "[data-slot='separator']"
    ) as HTMLElement | null;
    await step("role=separator e aria-orientation quando decorative=false", async () => {
      await expect(separator).toBeInTheDocument();
      await expect(separator).toHaveAttribute("role", "separator");
      await expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    });
  },
};
