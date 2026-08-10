import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";
import { AspectRatio } from "./aspect-ratio";

const meta = {
  title: "UI/Skeleton/Compositions",
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
      await expect(sk).toHaveClass("nds-motion-reduce-none");
    }
  });
}

export const ProfileCard: Story = {
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
      className="nds-cluster nds-p-4 nds-border-default nds-rounded-md" data-align="center" data-spacing="md" style={{ width: "20rem" }}
    >
      <Skeleton
        className="nds-rounded-full nds-motion-reduce-none" style={{ height: "3rem", width: "3rem" }}
        aria-hidden="true"
      />
      <div className="nds-stack" data-spacing="sm">
        <Skeleton
          className="nds-motion-reduce-none" style={{ height: "1rem", width: "200px" }}
          aria-hidden="true"
        />
        <Skeleton
          className="nds-motion-reduce-none" style={{ height: "1rem", width: "160px" }}
          aria-hidden="true"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};

export const ListWithAvatar: Story = {
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
      className="" data-spacing="md" style={{ width: "24rem" }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="nds-cluster" data-spacing="sm">
          <Skeleton
            className="nds-rounded-md nds-motion-reduce-none" style={{ height: "2.5rem", width: "2.5rem" }}
            aria-hidden="true"
          />
          <div className="nds-flex-1" data-spacing="sm">
            <Skeleton
              className="nds-motion-reduce-none" style={{ height: "1rem", width: "60%" }}
              aria-hidden="true"
            />
            <Skeleton
              className="nds-motion-reduce-none" style={{ height: "0.75rem", width: "40%" }}
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

export const ImageInAspectRatio: Story = {
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
      className="nds-w-sm"
    >
      <AspectRatio ratio={16 / 9}>
        <Skeleton
          className="nds-w-full nds-motion-reduce-none" style={{ height: "100%" }}
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
      className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}
    >
      <Skeleton
        className="nds-w-full nds-motion-reduce-none" style={{ height: "1rem" }}
        aria-hidden="true"
      />
      <Skeleton
        className="nds-motion-reduce-none" style={{ height: "1rem", width: "90%" }}
        aria-hidden="true"
      />
      <Skeleton
        className="nds-motion-reduce-none" style={{ height: "1rem", width: "60%" }}
        aria-hidden="true"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await assertSkeletonsAccessible(canvasElement, step as never);
  },
};
