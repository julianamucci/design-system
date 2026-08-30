import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton } from './skeleton';
import { skeletonSourceWith } from './skeleton.source';
import {
  animationAtiva,
  backgroundDistincao,
  ligarMovimentoReduzido,
} from '@shared/testing/skeleton-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Primitives/Feedback/Skeleton/States',
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

function regiaoWithLines(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', 'Carregando conteúdo');
  wrap.appendChild(createSkeleton({ shape: 'text', width: 'full' }));
  wrap.appendChild(createSkeleton({ shape: 'text', width: '3-4' }));
  return wrap;
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
  render: () => regiaoWithLines(),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('A classe base entrega pulso e raio', async () => {
      await expect(animationAtiva(sk)).toBe(true);
      await expect(getComputedStyle(sk).borderRadius).not.toBe('0px');
    });

    await step('O placeholder se distingue do fundo do container', async () => {
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
    covers: ['functional.item5', 'accessibility.item4'],
    docs: {
      description: {
        story:
          'Com movimento reduzido o pulso para. O esqueleto continua visível — o que some é a animação, não o placeholder.',
      },
    },
  },
  render: () => regiaoWithLines(),
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
