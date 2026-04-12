import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { Mail, X } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Tamanhos",
  component: Button,
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    children: "Botão",
    variant: "default",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: "sm" },
  parameters: {
    docs: {
      description: {
        story: "Tamanho compacto (h-8) para contextos com espaço reduzido — toolbars, tabelas e cards densos.",
      },
    },
  },
};

export const Default: Story = {
  args: { size: "default" },
  parameters: {
    docs: {
      description: {
        story: "Tamanho padrão (h-9). Adequado para a maioria dos contextos de interface.",
      },
    },
  },
};

export const Large: Story = {
  args: { size: "lg" },
  parameters: {
    docs: {
      description: {
        story: "Tamanho expandido (h-10) para CTAs de destaque — hero sections e landing pages.",
      },
    },
  },
};

export const IconOnly: Story = {
  render: (args) => (
    <Button {...args} size="icon" aria-label="Fechar">
      <X className="h-4 w-4" />
    </Button>
  ),
  args: { variant: "default" },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Critério a11y — botão icon-only com aria-label acessível
    await step("Botão icon-only possui aria-label e é acessível pelo nome", async () => {
      const button = canvas.getByRole("button", { name: "Fechar" });
      await expect(button).toHaveAttribute("aria-label", "Fechar");
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Tamanho quadrado (h-9 w-9). **Obrigatório** passar `aria-label` descritivo — sem ele o botão é inacessível para leitores de tela.",
      },
    },
  },
};

