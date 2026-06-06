import type { Meta, StoryObj } from "@storybook/react";
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
  render: () => <Button>Padrão (h-9)</Button>,
  parameters: {
    docs: {
      description: {
        story: "Tamanho padrão (36px). Use em formulários e diálogos como default.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /padrão/i })).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /pequeno/i })).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /grande/i })).toBeInTheDocument();
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão icon-only é acessível via aria-label", async () => {
      const button = canvas.getByRole("button", { name: "Adicionar item" });
      await expect(button).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão icon-only é acessível via aria-label", async () => {
      const button = canvas.getByRole("button", { name: "Adicionar item" });
      await expect(button).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão icon-only é acessível via aria-label", async () => {
      const button = canvas.getByRole("button", { name: "Adicionar item" });
      await expect(button).toBeInTheDocument();
    });
  },
};
