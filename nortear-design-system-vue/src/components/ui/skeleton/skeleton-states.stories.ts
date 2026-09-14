import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton, SkeletonRegion } from './index';
import {
  animationAtiva,
  distinctionByTheme,
  ligarMovimentoReduzido,
  radiusAgainstToken,
} from '@shared/testing/skeleton-probe';
import { skeletonReducedMotionSource, skeletonPulsingSource } from './skeleton.source';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/States',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonPulsingSource },
      description: {
        component:
          'Os dois estados que o conteúdo compartilhado documenta: o pulso padrão enquanto o conteúdo carrega, e o pulso desligado quando o sistema pede movimento reduzido.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Pulsing: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item5'],
    docs: {
      source: { transform: skeletonPulsingSource },
      description: {
        story:
          'Estado padrão: pulso por opacidade, cantos arredondados e fundo distinto do container.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando conteúdo" class="nds-stack nds-w-sm" data-spacing="sm">
        <Skeleton data-shape="text" data-width="full" />
        <Skeleton data-shape="text" data-width="3-4" />
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('A classe base entrega pulso e o raio do token', async () => {
      // `borderRadius !== '0px'` era falso no tema `cold`, que declara
      // `--radius: 0` como identidade de forma. Mede contra o token.
      await expect(animationAtiva(sk)).toBe(true);
      const { radius, expected } = radiusAgainstToken(sk);
      await expect(Math.abs(radius - expected)).toBeLessThanOrEqual(0.5);
    });

    await step('Em cada tema e modo, o placeholder se distingue do fundo', async () => {
      // Não é critério de contraste — o esqueleto não transmite informação. O
      // piso pega o caso degenerado: token trocado, opacidade zerada ou marca
      // cuja primária coincide com a superfície. Nos seis pares, não num só.
      // Fora de `waitFor`: a sonda troca classe de tema e força layout.
      const measures = distinctionByTheme(canvasElement, sk);
      await expect(measures.length).toBeGreaterThan(0);
      const indistinct = measures
        .filter((m) => !(m.ratio > 1.05))
        .map((m) => `${m.theme}/${m.mode}: ${m.ratio.toFixed(3)}`);
      await expect(indistinct).toEqual([]);
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4'],
    docs: {
      // A ausência é o assunto: não há prop nem atributo a escrever, e é isso
      // que o snippet precisa deixar claro ao lado da story.
      source: { transform: skeletonReducedMotionSource },
      description: {
        story:
          'Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando conteúdo" class="nds-stack nds-w-sm" data-spacing="sm">
        <Skeleton data-shape="text" data-width="full" />
        <Skeleton data-shape="text" data-width="3-4" />
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
    // Cada passo estabelece a própria precondição: o desfazer roda no finally
    // para a story seguinte (e a foto do Chromatic) não herdarem a marca.
    const desfazer = ligarMovimentoReduzido(canvasElement.ownerDocument);
    try {
      await step('Com movimento reduzido, o pulso é desligado', async () => {
        // Asserção pelo PAR, não pelo nome da animação: o nome muda por stack e
        // por versão, e `animationName !== 'none'` passava com duração zerada.
        await expect(animationAtiva(sk)).toBe(false);
      });

      await step('O placeholder continua visível e ocupando a caixa', async () => {
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
        await expect(getComputedStyle(sk).opacity).toBe('1');
      });
    } finally {
      desfazer();
    }

    await step('Sem a preferência, o pulso volta', async () => {
      await expect(animationAtiva(sk)).toBe(true);
    });
  },
};
