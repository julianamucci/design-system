import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton } from './skeleton';
import { regiaoDeCarregamento } from './skeleton.fixtures';
import {
  skeletonSource,
  skeletonSourceWith,
  ratioSkeletonSource,
} from './skeleton.source';
import { boxDesenhada } from '@shared/testing/skeleton-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Skeleton/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: skeletonSource },
      description: {
        component:
          'Formas do esqueleto. Não há variante via opção de estilo: a forma vem de `data-shape` e a largura de `data-width`, e a folha de estilo continua dona das medidas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Rectangle: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      // `fill` preenche a caixa que o container estabelece — sem container ele
      // nasce com altura zero, e o snippet mostra quem dá a caixa.
      source: { transform: ratioSkeletonSource({ regionLabel: 'Carregando bloco' }) },
      description: {
        story:
          '`data-shape="fill"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento('Carregando bloco', 'nds-w-sm');
    wrap.appendChild(createSkeleton({ shape: 'fill', className: 'nds-docs-skeleton-media' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('Preenche a caixa do container na proporção de mídia', async () => {
      const caixa = boxDesenhada(sk);
      await expect(caixa.largura).toBeGreaterThan(0);
      await expect(Math.abs(caixa.largura / caixa.altura - 16 / 9)).toBeLessThan(0.05);
    });

    await step('Continua fora da árvore de acessibilidade', async () => {
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Circle: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: skeletonSourceWith({ shape: 'avatar', regionLabel: 'Carregando avatar' }),
      },
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento('Carregando avatar');
    wrap.appendChild(createSkeleton({ shape: 'avatar' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('Quadrado com medida vinda do tema', async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      // Afirmar "40px" amarraria o teste ao tema padrão.
      const caixa = boxDesenhada(sk);
      await expect(caixa.largura).toBeGreaterThan(0);
      await expect(caixa.quadrado).toBe(true);
    });

    await step('O raio é circular, não o raio padrão do sistema', async () => {
      // Comportamento, não classe: o que importa é o círculo desenhado.
      await expect(boxDesenhada(sk).circular).toBe(true);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    docs: {
      // Três linhas de larguras diferentes: uma peça só não mostraria o que faz
      // o bloco parecer parágrafo.
      source: {
        transform: skeletonSourceWith({
          regionLabel: 'Carregando linhas de texto',
          linhas: [
            { shape: 'text', width: 'full' },
            { shape: 'text', width: '3-4' },
            { shape: 'text', width: '1-2' },
          ],
        }),
      },
      description: {
        story:
          'Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento('Carregando linhas de texto', 'nds-stack nds-w-sm');
    wrap.dataset.spacing = 'sm';
    for (const width of ['full', '3-4', '1-2'] as const) {
      wrap.appendChild(createSkeleton({ shape: 'text', width }));
    }
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const linhas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('Três linhas, todas com altura desenhada', async () => {
      await expect(linhas).toHaveLength(3);
      for (const l of linhas) await expect(l.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('As larguras decrescem na ordem declarada', async () => {
      // É a asserção que faltava: o tradutor de classe utilitária descartava
      // `w-[60%]` em silêncio e as três linhas saíam do mesmo tamanho.
      const larguras = linhas.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
