import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import { boxDesenhada } from '@shared/testing/skeleton-probe';
import {
  skeletonCirculoSource,
  skeletonLineTextSource,
  skeletonRetanguloSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'Primitives/Feedback/Skeleton/Variants',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonRetanguloSource },
      description: {
        component:
          'Formas do esqueleto. Não há variante via prop: a forma vem de `data-shape` e a largura de `data-width`, e a folha de estilo continua dona das medidas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Rectangle: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          '`data-shape="fill"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando bloco" class="nds-w-sm">
        <Skeleton data-shape="fill" class="nds-docs-skeleton-media" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('Preenche a caixa do container na proporção de mídia', async () => {
      const box = boxDesenhada(sk);
      await expect(box.width).toBeGreaterThan(0);
      await expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.05);
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
      // Outra forma e sem container de proporção: `avatar` traz medida própria,
      // ao contrário do `fill` que o meta mostra.
      source: { transform: skeletonCirculoSource },
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando avatar">
        <Skeleton data-shape="avatar" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('Quadrado com medida vinda do tema', async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      // Afirmar "40px" amarraria o teste ao tema padrão.
      const box = boxDesenhada(sk);
      await expect(box.width).toBeGreaterThan(0);
      await expect(box.quadrado).toBe(true);
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
      // São três peças com larguras diferentes: a lição é a variação entre as
      // linhas, e uma peça só não a mostra.
      source: { transform: skeletonLineTextSource },
      description: {
        story:
          'Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando linhas de texto"
        class="nds-stack nds-w-sm"
        data-spacing="sm"
      >
        <Skeleton data-shape="text" data-width="full" />
        <Skeleton data-shape="text" data-width="3-4" />
        <Skeleton data-shape="text" data-width="1-2" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]'),
    ];

    await step('Três linhas, todas com altura desenhada', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('As larguras decrescem na ordem declarada', async () => {
      // É a asserção que faltava: com `w-[250px]` inerte as três saíam iguais.
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
