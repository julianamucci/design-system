import type { Meta, StoryObj } from "@storybook/react-vite";
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
    <div role="status" aria-busy="true" aria-label="Carregando bloco" className="nds-w-xs">
      <Skeleton className="nds-w-full nds-motion-reduce-none" style={{ height: "5rem" }} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de retângulo (h-20 w-full + radius do componente)", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveStyle({ height: "80px" });
      await expect(skeleton).toHaveClass("nds-w-full");
      await expect(skeleton).toHaveClass("nds-skeleton");
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
      <Skeleton className="nds-rounded-full nds-motion-reduce-none" style={{ height: "3rem", width: "3rem" }} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de círculo (h-12 w-12 rounded-full)", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveStyle({ height: "48px", width: "48px" });
      await expect(skeleton).toHaveClass("nds-rounded-full");
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
      <Skeleton className="nds-motion-reduce-none" style={{ height: "1rem", width: "200px" }} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    await step("Aplica classes de linha (h-4 w-[200px])", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveStyle({ height: "16px", width: "200px" });
    });
  },
};
