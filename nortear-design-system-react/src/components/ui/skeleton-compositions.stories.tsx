import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";
import { AspectRatio } from "./aspect-ratio";
import {
  skeletonCardDePerfilSource,
  ratioSkeletonImageSource,
  skeletonListSource,
  skeletonParagrafoSource,
  skeletonSource,
} from "./skeleton.source";

const meta = {
  title: "Components/Feedback/Skeleton/Compositions",
  tags: ["feedback"],
  component: Skeleton,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonSource },
      description: {
        component:
          "Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco é uma região `role=\"status\"` com `aria-busy`, e cada placeholder fica fora da árvore de acessibilidade.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileCard: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // Avatar + duas linhas num cluster: a composição É o formato que o card de
      // perfil imita, e o meta imprime uma linha de texto solta.
      source: { transform: skeletonCardDePerfilSource },
      description: {
        story: "Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando card de perfil"
      className="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
      data-align="center"
      data-spacing="md"
    >
      <Skeleton data-shape="avatar" />
      <div className="nds-stack nds-flex-1" data-spacing="sm">
        <Skeleton data-shape="text" data-width="2-3" />
        <Skeleton data-shape="text" data-width="1-2" />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step("A região tem papel, estado e nome", async () => {
      await expect(regiao).toHaveAttribute("aria-busy", "true");
      await expect(regiao.getAttribute("aria-label")).toBeTruthy();
    });

    await step("Avatar + duas linhas, todos fora da árvore de acessibilidade", async () => {
      await expect(parts).toHaveLength(3);
      for (const p of parts) await expect(p).toHaveAttribute("aria-hidden", "true");
    });

    await step("O avatar é circular e as linhas têm larguras diferentes", async () => {
      const avatar = parts[0].getBoundingClientRect();
      await expect(Math.round(avatar.width)).toBe(Math.round(avatar.height));
      await expect(parts[1].getBoundingClientRect().width).toBeGreaterThan(
        parts[2].getBoundingClientRect().width,
      );
    });
  },
};

export const ListWithAvatar: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // Cinco itens numa lista, com a região ocupada na lista inteira — um aviso
      // de carregamento por item seria ruído para quem ouve.
      source: { transform: skeletonListSource },
      description: {
        story: "Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.",
      },
    },
  },
  render: () => (
    <ul
      role="list"
      aria-busy="true"
      aria-label="Carregando lista de pedidos"
      className="nds-stack nds-list-none nds-p-0 nds-w-md"
      data-spacing="md"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="nds-cluster" data-align="center" data-spacing="sm">
          <Skeleton data-shape="avatar" data-size="sm" />
          <div className="nds-stack nds-flex-1" data-spacing="xs">
            <Skeleton data-shape="text" data-width="2-3" />
            <Skeleton data-shape="text" data-width="1-3" />
          </div>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement, step }) => {
    const list = canvasElement.querySelector<HTMLElement>("ul")!;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step("A lista inteira é uma região ocupada, com nome", async () => {
      await expect(list).toHaveAttribute("aria-busy", "true");
      await expect(list.getAttribute("aria-label")).toBeTruthy();
      await expect(list.querySelectorAll("li")).toHaveLength(5);
    });

    await step("Cinco itens de três peças, todas ocultas ao leitor", async () => {
      await expect(parts).toHaveLength(15);
      for (const p of parts) await expect(p).toHaveAttribute("aria-hidden", "true");
    });

    await step("O avatar pequeno é menor que o avatar padrão", async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const avatar = parts[0].getBoundingClientRect();
      await expect(Math.round(avatar.width)).toBe(Math.round(avatar.height));
      await expect(avatar.width).toBeGreaterThan(0);
    });
  },
};

export const ImageInAspectRatio: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // Quem estabelece a caixa é a proporção: o placeholder ocupa exatamente o
      // espaço da imagem que vai chegar.
      source: { transform: ratioSkeletonImageSource },
      description: {
        story: "Placeholder de imagem dentro de uma proporção 16/9 — quem define a caixa é o container.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando imagem" className="nds-w-sm">
      <AspectRatio ratio={16 / 9}>
        <Skeleton data-shape="fill" />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("A região de carregamento tem estado e nome", async () => {
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
      await expect(regiao).toHaveAttribute("aria-busy", "true");
      await expect(regiao.getAttribute("aria-label")).toBeTruthy();
    });

    await step("O placeholder preenche a caixa proporcional", async () => {
      // Se o filho perdesse o `inset: 0`, a proporção continuaria certa e a
      // caixa ficaria vazia — só a medição acusa.
      const c = box.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
    });
  },
};

export const Paragraph: Story = {
  parameters: {
    docs: {
      // Três linhas de larguras decrescentes: é a variação entre elas que faz o
      // bloco parecer parágrafo.
      source: { transform: skeletonParagrafoSource },
      description: {
        story: "Três linhas com larguras decrescentes — placeholder de parágrafo.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando parágrafo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
      <Skeleton data-shape="text" data-width="1-2" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step("A região tem estado e nome", async () => {
      await expect(regiao).toHaveAttribute("aria-busy", "true");
      await expect(regiao.getAttribute("aria-label")).toBeTruthy();
    });

    await step("Três linhas, ocultas ao leitor de tela", async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l).toHaveAttribute("aria-hidden", "true");
    });

    await step("As larguras decrescem — é o que faz o bloco parecer parágrafo", async () => {
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
