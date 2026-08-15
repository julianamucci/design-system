import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SkeletonVarianteStory from './SkeletonVarianteStory.svelte';
import { caixaDesenhada } from '@shared/testing/skeleton-probe';

const meta: Meta = {
  title: 'UI/Skeleton/Variants',
  component: SkeletonVarianteStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Formas do esqueleto. Não há variante via prop: a forma vem de `data-shape` e a largura de `data-width`, e a folha de estilo continua dona das medidas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Rectangle: Story = {
  args: { variant: 'rectangle' },
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          '`data-shape="fill"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('Preenche a caixa do container na proporção de mídia', async () => {
      const caixa = caixaDesenhada(sk);
      await expect(caixa.largura).toBeGreaterThan(0);
      await expect(Math.abs(caixa.largura / caixa.altura - 16 / 9)).toBeLessThan(0.05);
    });

    await step('Continua fora da árvore de acessibilidade', async () => {
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Circle: Story = {
  args: { variant: 'circle' },
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('Quadrado com medida vinda do tema', async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      // Afirmar "40px" amarraria o teste ao tema padrão.
      const caixa = caixaDesenhada(sk);
      await expect(caixa.largura).toBeGreaterThan(0);
      await expect(caixa.quadrado).toBe(true);
    });

    await step('O raio é circular, não o raio padrão do sistema', async () => {
      // Comportamento, não classe: o que importa é o círculo desenhado.
      await expect(caixaDesenhada(sk).circular).toBe(true);
    });
  },
};

export const TextLine: Story = {
  args: { variant: 'textLine' },
  parameters: {
    docs: {
      description: {
        story:
          'Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const linhas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('Três linhas, todas com altura desenhada', async () => {
      await expect(linhas).toHaveLength(3);
      for (const l of linhas) await expect(l.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('As larguras decrescem na ordem declarada', async () => {
      // É a asserção que faltava: com `w-[200px]` inerte as três saíam iguais.
      const larguras = linhas.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
