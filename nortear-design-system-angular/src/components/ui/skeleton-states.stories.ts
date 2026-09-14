import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SKELETON } from './skeleton';
import { skeletonStatesSource } from './skeleton.source';
import {
  animationAtiva,
  distinctionByTheme,
  ligarMovimentoReduzido,
  radiusAgainstToken,
} from '@shared/testing/skeleton-probe';

// As duas stories montam a MESMA região de duas linhas: o que muda entre elas é
// a preferência do sistema, que input nenhum da diretiva controla.
const TWO_LINES = `
  <div ndsSkeletonRegion label="Carregando conteúdo" class="nds-stack nds-w-sm" data-spacing="sm">
    <div ndsSkeleton data-shape="text" data-width="full"></div>
    <div ndsSkeleton data-shape="text" data-width="3-4"></div>
  </div>
`;

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/States',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_SKELETON] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: skeletonStatesSource },
      description: {
        component:
          'Os dois estados que o conteúdo compartilhado documenta: o pulso padrão enquanto o conteúdo carrega, e o pulso desligado quando o sistema pede movimento reduzido.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Pulsing: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item5'],
    docs: {
      source: { transform: skeletonStatesSource },
      description: {
        story:
          'Estado padrão: pulso por opacidade, cantos arredondados e fundo distinto do container.',
      },
    },
  },
  render: () => ({ template: TWO_LINES }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;

    await step('A classe base entrega pulso e o raio do token', async () => {
      await expect(animationAtiva(sk)).toBe(true);
      // Contra o token, e não `!== '0px'`: o tema `cold` declara `--radius: 0`
      // como identidade, e a asserção antiga reprovaria um tema legítimo.
      const { radius, expected } = radiusAgainstToken(sk);
      await expect(
        Math.abs(radius - expected),
        `raio ${radius}px contra ${expected}px do token`,
      ).toBeLessThanOrEqual(0.5);
    });

    await step('Em cada tema e modo, o placeholder se distingue do fundo', async () => {
      // A superfície é a primária a 10%, então muda com a marca: é o tema que
      // não se mede que pode fazê-la coincidir com o fundo. A sonda troca
      // classe e lê cor — fora de `waitFor`.
      for (const d of distinctionByTheme(canvasElement, sk)) {
        await expect(
          d.ratio,
          `${d.theme}/${d.mode}: placeholder ${d.placeholder} sobre ${d.container}`,
        ).toBeGreaterThan(1.05);
      }
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4'],
    docs: {
      source: { transform: skeletonStatesSource },
      description: {
        story:
          'Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.',
      },
    },
  },
  render: () => ({ template: TWO_LINES }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;
    // Cada passo estabelece a própria precondição: o desfazer roda no finally
    // para a story seguinte (e a foto do Chromatic) não herdarem a marca.
    const undo = ligarMovimentoReduzido(canvasElement.ownerDocument);
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
      undo();
    }

    await step('Sem a preferência, o pulso volta', async () => {
      await expect(animationAtiva(sk)).toBe(true);
    });
  },
};
