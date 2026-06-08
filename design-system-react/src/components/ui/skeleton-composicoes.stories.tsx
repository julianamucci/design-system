import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";
import { AspectRatio } from "./aspect-ratio";

const meta = {
  title: "UI/Skeleton/Composicoes",
  tags: ["feedback"],
  component: Skeleton,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas do Skeleton — card de perfil, lista, imagem em AspectRatio e parágrafo. Cada composição tem `aria-busy` no container e `aria-hidden` nos Skeletons.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

async function assertSkeletonsAccessible(canvasElement: HTMLElement, step: (label: string, fn: () => Promise<void>) => Promise<void>) {
  const container = canvasElement.querySelector("[aria-busy='true']") as HTMLElement | null;
  const skeletons = Array.from(
    canvasElement.querySelectorAll("[data-slot='skeleton']")
  ) as HTMLElement[];

  await step("Container tem aria-busy=true e aria-label", async () => {
    await expect(container).toBeInTheDocument();
    await expect(container).toHaveAttribute("aria-busy", "true");
    await expect(container).toHaveAttribute("aria-label");
  });

  await step("Cada Skeleton tem aria-hidden e motion-reduce:animate-none", async () => {
    await expect(skeletons.length).toBeGreaterThan(0);
    for (const sk of skeletons) {
      await expect(sk).toHaveAttribute("aria-hidden", "true");
      await expect(sk).toHaveClass("motion-reduce:animate-none");
    }
  });
}

export const CardDePerfil: Story = {
  parameters: {
    docs: {
      description: {
        story: "Avatar circular + 2 linhas de texto — padrão de loading para card de perfil.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando card de perfil"
      className="flex items-center gap-4 w-80 p-4 border rounded-md"
    >
      <Skeleton
        className="h-12 w-12 rounded-full motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div className="space-y-2">
        <Skeleton
          className="h-4 w-[200px] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <Skeleton
          className="h-4 w-[160px] motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};

export const ListaComAvatar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "5 ítens com avatar quadrado + 2 linhas — padrão de loading para listas (Array.map com Skeletons).",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando lista de pedidos"
      className="w-96 space-y-4"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton
            className="h-10 w-10 rounded-md motion-reduce:animate-none"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <Skeleton
              className="h-4 w-[60%] motion-reduce:animate-none"
              aria-hidden="true"
            />
            <Skeleton
              className="h-3 w-[40%] motion-reduce:animate-none"
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};

export const ImagemEmAspectRatio: Story = {
  parameters: {
    docs: {
      description: {
        story: "Skeleton dentro de AspectRatio 16/9 — placeholder para imagens proporcionais.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando imagem"
      className="w-80"
    >
      <AspectRatio ratio={16 / 9}>
        <Skeleton
          className="h-full w-full motion-reduce:animate-none"
          aria-hidden="true"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};

export const Paragrafo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "3 linhas de texto com larguras variáveis — placeholder de parágrafo de texto.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando parágrafo"
      className="w-80 space-y-2"
    >
      <Skeleton
        className="h-4 w-full motion-reduce:animate-none"
        aria-hidden="true"
      />
      <Skeleton
        className="h-4 w-[90%] motion-reduce:animate-none"
        aria-hidden="true"
      />
      <Skeleton
        className="h-4 w-[60%] motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};
