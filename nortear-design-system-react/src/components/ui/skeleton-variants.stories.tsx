import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton, SkeletonRegion } from "./skeleton";
import { AspectRatio } from "./aspect-ratio";
import {
  skeletonAvatarSource,
  midiaSkeletonBlockSource,
  skeletonParagrafoSource,
  skeletonSource,
} from "./skeleton.source";
import { avatarIgnoresWidth, boxDesenhada, heightAgainstToken } from "@shared/testing/skeleton-probe";

const meta = {
  title: "Components/Feedback/Skeleton/Variants",
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
      // `fill` não tem medida própria: quem estabelece a caixa é o `AspectRatio`
      // em volta — na story e no snippet, que por isso mostram o mesmo exemplo.
      source: { transform: midiaSkeletonBlockSource },
      description: {
        story:
          "`data-shape=\"fill\"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.",
      },
    },
  },
  render: () => (
    <SkeletonRegion label="Carregando bloco" className="nds-w-sm">
      <AspectRatio ratio={16 / 9}>
        <Skeleton data-shape="fill" />
      </AspectRatio>
    </SkeletonRegion>
  ),
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("Preenche a caixa que o AspectRatio estabelece", async () => {
      // A proporção é do CONTAINER: medir só o retângulo do esqueleto passava
      // com a classe de docs page que dava a caixa por fora da API.
      const c = caixa.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(c.width).toBeGreaterThan(0);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
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
      // A AUSÊNCIA de `data-width` é o assunto: a fração só vale para as formas
      // de texto, e o avatar tira a medida da escada de tamanhos.
      source: { transform: skeletonAvatarSource },
      description: {
        story:
          "`data-shape=\"avatar\"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.",
      },
    },
  },
  render: () => (
    <SkeletonRegion label="Carregando avatar">
      <Skeleton data-shape="avatar" />
    </SkeletonRegion>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("Quadrado com raio circular, medida vinda do tema", async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      // Afirmar "40px" amarraria o teste ao tema padrão.
      const box = boxDesenhada(sk);
      await expect(box.width).toBeGreaterThan(0);
      await expect(box.quadrado).toBe(true);
      await expect(box.circular).toBe(true);
    });

    await step("Uma fração de largura não deforma o avatar", async () => {
      // A regra de largura vinha depois da de avatar, com a mesma
      // especificidade, e o avatar saía retângulo.
      await expect(avatarIgnoresWidth(sk).quadrado).toBe(true);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    covers: ["functional.item2"],
    docs: {
      // São TRÊS linhas de larguras diferentes, e a variação entre elas é o que
      // faz o bloco ser lido como texto — uma linha só não ensina isso.
      source: { transform: skeletonParagrafoSource },
      description: {
        story:
          "Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.",
      },
    },
  },
  render: () => (
    <SkeletonRegion
      label="Carregando parágrafo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
      <Skeleton data-shape="text" data-width="1-2" />
    </SkeletonRegion>
  ),
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step("Três linhas com a altura do token de texto", async () => {
      // `height > 0` pegava o colapso e deixava passar altura cravada por fora
      // e desvio da escada: a medida tem de ser exatamente a do token.
      await expect(lines).toHaveLength(3);
      for (const l of lines) {
        const { token, height, expected } = heightAgainstToken(l);
        await expect(Math.abs(height - expected), `${token}: ${height} ≠ ${expected}`).toBeLessThanOrEqual(0.5);
      }
    });

    await step("As larguras decrescem na ordem declarada", async () => {
      // É a asserção que faltava: com `w-[250px]` inerte as três saíam iguais.
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
