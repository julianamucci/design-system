import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Tamanhos",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button>Padrão (h-9)</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho padrão (36px). Use em formulários e diálogos como default.",
      },
    },
  },
};

export const Small: Story = {
  render: () => <Button size="sm">Pequeno (h-8)</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho pequeno (32px). Use em toolbars e áreas densas.",
      },
    },
  },
};

export const Large: Story = {
  render: () => <Button size="lg">Grande (h-10)</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho grande (40px). Use em CTAs de destaque e hero sections.",
      },
    },
  },
};

export const Icon: Story = {
  render: () => (
    <Button size="icon" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Botão ícone padrão (36×36). Sempre forneça aria-label descritivo.",
      },
    },
  },
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
        story: "Botão ícone pequeno (32×32). Use em toolbars compactas.",
      },
    },
  },
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
        story: "Botão ícone grande (40×40). Use como FAB ou CTAs visuais.",
      },
    },
  },
};
