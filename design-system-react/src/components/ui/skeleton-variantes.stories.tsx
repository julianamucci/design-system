import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton/Variantes",
  tags: ["feedback"],
  component: Skeleton,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Skeleton — Retângulo, Círculo e Linha de texto. Não há variantes via cva(); a forma é controlada por className (rounded-md, rounded-full, h-4 w-[200px]).",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Retangulo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padrão `rounded-md` com `h-20 w-full` — placeholder para imagens, cards e blocos.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando bloco" className="w-64">
      <Skeleton className="h-20 w-full motion-reduce:animate-none" aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de retângulo (h-20 w-full rounded-md)", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveClass("h-20");
      await expect(skeleton).toHaveClass("w-full");
      await expect(skeleton).toHaveClass("rounded-md");
    });
  },
};

export const Circulo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Combinado com `rounded-full` (`h-12 w-12`) — placeholder para avatares e ícones circulares.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando avatar">
      <Skeleton className="h-12 w-12 rounded-full motion-reduce:animate-none" aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de círculo (h-12 w-12 rounded-full)", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveClass("h-12");
      await expect(skeleton).toHaveClass("w-12");
      await expect(skeleton).toHaveClass("rounded-full");
    });
  },
};

export const LinhaDeTexto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Altura fixa (`h-4`) com largura definida (`w-[200px]`) — placeholder para linhas de texto.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando texto">
      <Skeleton className="h-4 w-[200px] motion-reduce:animate-none" aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de linha (h-4 w-[200px])", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveClass("h-4");
      await expect(skeleton).toHaveClass("w-[200px]");
    });
  },
};
