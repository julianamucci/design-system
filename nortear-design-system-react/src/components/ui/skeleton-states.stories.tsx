import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "./skeleton";
import { skeletonPulsandoSource, skeletonSource } from "./skeleton.source";
import {
  animationAtiva,
  backgroundDistincao,
  ligarMovimentoReduzido,
} from "@shared/testing/skeleton-probe";

const meta = {
  title: "UI/Skeleton/States",
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
      source: { transform: skeletonPulsandoSource },
      description: {
        story:
          "Estado padrão: pulso por opacidade, cantos arredondados e fundo distinto do container.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando conteúdo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step("A classe base entrega pulso e raio", async () => {
      await expect(animationAtiva(sk)).toBe(true);
      await expect(getComputedStyle(sk).borderRadius).not.toBe("0px");
    });

    await step("O placeholder se distingue do fundo do container", async () => {
      // Não é critério de contraste — o esqueleto não transmite informação. O
      // piso pega o caso degenerado: token trocado ou opacidade zerada fazem o
      // placeholder sumir, e o carregamento deixa de ser visível.
      const { ratio } = backgroundDistincao(sk);
      await expect(ratio).toBeGreaterThan(1.05);
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item4"],
    docs: {
      description: {
        story:
          "Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.",
      },
    },
  },
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando conteúdo"
      className="nds-stack nds-w-sm"
      data-spacing="sm"
    >
      <Skeleton data-shape="text" data-width="3-4" />
    </div>
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
