import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Plus } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Tamanhos",
  tags: ["form"],
  component: Button,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button>Padrão</Button>,
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story: "Tamanho padrão. Use em formulários e diálogos como default.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /padrão/i });
    await expect(btn).toHaveClass("nds-button");
    await expect(btn).not.toHaveClass("nds-button-xs");
    await expect(btn).not.toHaveClass("nds-button-sm");
    await expect(btn).not.toHaveClass("nds-button-lg");
  },
};

export const ExtraSmall: Story = {
  render: () => <Button size="xs">Mínimo</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho mínimo. Use em densidades máximas: chips de filtro e ações dentro de linha de tabela.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /mínimo/i });
    await expect(btn).toHaveClass("nds-button-xs");
  },
};

export const Small: Story = {
  render: () => <Button size="sm">Pequeno</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho pequeno. Use em toolbars e áreas densas.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /pequeno/i });
    await expect(btn).toHaveClass("nds-button-sm");
  },
};

export const Large: Story = {
  render: () => <Button size="lg">Grande</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho grande. Use em CTAs de destaque e hero sections.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /grande/i });
    await expect(btn).toHaveClass("nds-button-lg");
  },
};

// Os quatro botões icon-only provam a mesma coisa: o nome acessível vem do
// aria-label, não do ícone. Uma função só, como nas outras stacks.
const iconAriaLabelPlay: Story["play"] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  await step("Botão icon-only é acessível via aria-label", async () => {
    const button = canvas.getByRole("button", { name: "Adicionar item" });
    await expect(button).toBeInTheDocument();
  });
};

export const Icon: Story = {
  render: () => (
    <Button size="icon" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    covers: ["functional.item6", "accessibility.item4"],
    docs: {
      description: {
        story: "Botão ícone padrão. Sempre forneça aria-label descritivo.",
      },
    },
  },
  play: iconAriaLabelPlay,
};

export const IconExtraSmall: Story = {
  render: () => (
    <Button size="icon-xs" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Botão ícone mínimo. Use em linhas de tabela e listas densas.",
      },
    },
  },
  play: iconAriaLabelPlay,
};

export const IconSmall: Story = {
  render: () => (
    <Button size="icon-sm" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Botão ícone pequeno. Use em toolbars compactas.",
      },
    },
  },
  play: iconAriaLabelPlay,
};

export const IconLarge: Story = {
  render: () => (
    <Button size="icon-lg" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Botão ícone grande. Use como FAB ou CTAs visuais.",
      },
    },
  },
  play: iconAriaLabelPlay,
};
