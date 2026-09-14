import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton, SkeletonRegion } from "./skeleton";
import { skeletonStatesSource, skeletonSource } from "./skeleton.source";
import {
  animationAtiva,
  distinctionByTheme,
  ligarMovimentoReduzido,
  radiusAgainstToken,
} from "@shared/testing/skeleton-probe";

const meta = {
  title: "Components/Feedback/Skeleton/States",
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
          "Os dois estados que o conteúdo compartilhado documenta: o pulso padrão enquanto o conteúdo carrega, e o pulso desligado quando o sistema pede movimento reduzido.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pulsing: Story = {
  parameters: {
    covers: ["functional.item1", "accessibility.item5"],
    docs: {
      // Duas linhas empilhadas: o pulso só é lido como bloco carregando quando
      // há mais de uma barra, e o meta imprime a linha solta do Playground.
      source: { transform: skeletonStatesSource },
      description: {
        story:
          "Estado padrão: pulso por opacidade, cantos arredondados e fundo distinto do container.",
      },
    },
  },
  render: () => (
    <SkeletonRegion
      label="Carregando conteúdo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
    </SkeletonRegion>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("A classe base entrega pulso e o raio do token", async () => {
      // `borderRadius !== '0px'` reprovaria o tema `cold`, que declara
      // `--radius: 0` como identidade: o raio se mede contra o token.
      await expect(animationAtiva(sk)).toBe(true);
      const { radius, expected } = radiusAgainstToken(sk);
      await expect(Math.abs(radius - expected)).toBeLessThanOrEqual(0.5);
    });

    await step("Em cada tema e modo, o placeholder se distingue do fundo", async () => {
      // Não é critério de contraste — o esqueleto não transmite informação. O
      // piso pega o caso degenerado: token trocado, opacidade zerada ou tema em
      // que a primária coincide com a superfície. Medido fora de `waitFor`: a
      // sonda mexe no DOM.
      for (const { theme, mode, ratio } of distinctionByTheme(canvasElement, sk)) {
        await expect(ratio, `${theme}/${mode}`).toBeGreaterThan(1.05);
      }
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item4"],
    docs: {
      // A MESMA região de duas linhas do Pulsing: o que muda é a preferência do
      // sistema, que prop nenhuma controla.
      source: { transform: skeletonStatesSource },
      description: {
        story:
          "Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.",
      },
    },
  },
  render: () => (
    <SkeletonRegion
      label="Carregando conteúdo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
    </SkeletonRegion>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    // Cada passo estabelece a própria precondição: o desfazer roda no finally
    // para a story seguinte (e a foto do Chromatic) não herdarem a marca.
    const desfazer = ligarMovimentoReduzido(canvasElement.ownerDocument);
    try {
      await step("Com movimento reduzido, o pulso é desligado", async () => {
        // Asserção pelo PAR, não pelo nome da animação: o nome muda por stack e
        // por versão, e `animationName !== 'none'` passava com duração zerada.
        await expect(animationAtiva(sk)).toBe(false);
      });

      await step("O placeholder continua visível e ocupando a caixa", async () => {
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
        await expect(getComputedStyle(sk).opacity).toBe("1");
      });
    } finally {
      desfazer();
    }

    await step("Sem a preferência, o pulso volta", async () => {
      await expect(animationAtiva(sk)).toBe(true);
    });
  },
};
