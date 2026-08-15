import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton/Variants",
  tags: ["feedback"],
  component: Skeleton,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Formas do esqueleto. Não há variante via prop: a forma vem de `data-shape` e a largura de `data-width`, e a folha de estilo continua dona das medidas.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rectangle: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "`data-shape=\"fill\"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando bloco" className="nds-w-sm">
      <Skeleton data-shape="fill" className="nds-docs-skeleton-media" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("Preenche a caixa do container na proporção de mídia", async () => {
      const caixa = sk.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(0);
      await expect(Math.abs(caixa.width / caixa.height - 16 / 9)).toBeLessThan(0.05);
    });

    await step("Continua fora da árvore de acessibilidade", async () => {
      await expect(sk).toHaveAttribute("aria-hidden", "true");
    });
  },
};

export const Circle: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "`data-shape=\"avatar\"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.",
      },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando avatar">
      <Skeleton data-shape="avatar" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("Quadrado com medida vinda do tema", async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      // Afirmar "40px" amarraria o teste ao tema padrão.
      const caixa = sk.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(0);
      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
    });

    await step("O raio é circular, não o raio padrão do sistema", async () => {
      // Comportamento, não classe: o que importa é o círculo desenhado.
      const raio = Number.parseFloat(getComputedStyle(sk).borderTopLeftRadius);
      await expect(raio).toBeGreaterThanOrEqual(sk.getBoundingClientRect().width / 2 - 0.5);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando linhas de texto"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
      <Skeleton data-shape="text" data-width="1-2" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const linhas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step("Três linhas, todas com altura desenhada", async () => {
      await expect(linhas).toHaveLength(3);
      for (const l of linhas) await expect(l.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step("As larguras decrescem na ordem declarada", async () => {
      // É a asserção que faltava: com `w-[250px]` inerte as três saíam iguais.
      const larguras = linhas.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
