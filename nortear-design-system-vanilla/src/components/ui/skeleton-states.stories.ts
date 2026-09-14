import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton, createSkeletonRegion } from './skeleton';
import { skeletonSourceWith } from './skeleton.source';
import {
  animationAtiva,
  distinctionByTheme,
  ligarMovimentoReduzido,
  radiusAgainstToken,
} from '@shared/testing/skeleton-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Components/Feedback/Skeleton/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      // As duas stories montam a MESMA região de duas linhas: o que muda entre
      // elas é a preferência do sistema, que opção nenhuma da fábrica controla.
      source: {
        transform: skeletonSourceWith({
          lines: [
            { shape: 'text', width: 'full' },
            { shape: 'text', width: '3-4' },
          ],
        }),
      },
      description: {
        component:
          'Os dois estados que o conteúdo compartilhado documenta: o pulso padrão enquanto o conteúdo carrega, e o pulso desligado quando o sistema pede movimento reduzido.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function regionWithLines(): HTMLElement {
  const region = createSkeletonRegion({
    label: 'Carregando conteúdo',
    class: 'nds-stack nds-w-sm',
    children: [
      createSkeleton({ shape: 'text', width: 'full' }),
      createSkeleton({ shape: 'text', width: '3-4' }),
    ],
  });
  region.dataset.spacing = 'sm';
  return region;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Pulsing: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Estado padrão: pulso por opacidade, cantos arredondados e fundo distinto do container.',
      },
    },
  },
  render: () => regionWithLines(),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('A classe base entrega pulso e o raio do token', async () => {
      await expect(animationAtiva(sk)).toBe(true);
      // Contra o TOKEN, não contra `0px`: o tema `cold` declara `--radius: 0`
      // como identidade de forma, e a asserção antiga reprovaria um tema
      // legítimo. A sonda mexe no DOM — fora de `waitFor`.
      const { radius, expected } = radiusAgainstToken(sk);
      await expect(
        Math.abs(radius - expected),
        `raio ${radius}px contra ${expected}px do token`,
      ).toBeLessThanOrEqual(0.5);
    });

    await step('Em cada tema e modo, o placeholder se distingue do fundo', async () => {
      // Não é critério de contraste — o esqueleto não transmite informação. O
      // piso pega o caso degenerado: a superfície é a primária a 10%, então ela
      // muda com a marca, e o tema que não é medido é o que pode sumir.
      for (const { theme, mode, ratio } of distinctionByTheme(canvasElement, sk)) {
        await expect(ratio, `${theme}/${mode}: razão ${ratio.toFixed(3)}`).toBeGreaterThan(1.05);
      }
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4'],
    docs: {
      description: {
        story:
          'Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.',
      },
    },
  },
  render: () => regionWithLines(),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
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
