import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton, createSkeletonRegion } from './skeleton';
import {
  skeletonSource,
  skeletonSourceWith,
  ratioSkeletonSource,
} from './skeleton.source';
import {
  avatarIgnoresWidth,
  boxDesenhada,
  heightAgainstToken,
} from '@shared/testing/skeleton-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Components/Feedback/Skeleton/Variants',
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
  render: () =>
    createSkeletonRegion({
      label: 'Carregando bloco',
      class: 'nds-w-sm',
      children: createSkeleton({ shape: 'fill', className: 'nds-docs-skeleton-media' }),
    }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

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
      source: {
        transform: skeletonSourceWith({ shape: 'avatar', regionLabel: 'Carregando avatar' }),
      },
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  render: () =>
    createSkeletonRegion({
      label: 'Carregando avatar',
      children: createSkeleton({ shape: 'avatar' }),
    }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

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

    await step('Com fração de largura posta, o avatar continua quadrado', async () => {
      // A folha restringe `data-width` às formas que não são avatar; antes a
      // regra de largura vencia pela ordem e o avatar saía retângulo. A sonda
      // põe o atributo e o devolve como estava.
      const box = avatarIgnoresWidth(sk);
      await expect(box.quadrado, `avatar com data-width mediu ${box.width}×${box.height}`).toBe(true);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // Três linhas de larguras diferentes: uma peça só não mostraria o que faz
      // o bloco parecer parágrafo.
      source: {
        transform: skeletonSourceWith({
          regionLabel: 'Carregando linhas de texto',
          lines: [
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
    const region = createSkeletonRegion({
      label: 'Carregando linhas de texto',
      class: 'nds-stack nds-w-sm',
      children: (['full', '3-4', '1-2'] as const).map((width) =>
        createSkeleton({ shape: 'text', width }),
      ),
    });
    region.dataset.spacing = 'sm';
    return region;
  },
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('Três linhas, todas com altura desenhada', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('A altura é exatamente a do token da escada de texto', async () => {
      // `height > 0` pega o colapso e deixa passar altura cravada por fora. A
      // sonda mexe no DOM: fora de `waitFor`.
      for (const l of lines) {
        const { token, height, expected } = heightAgainstToken(l);
        await expect(
          Math.abs(height - expected),
          `linha mediu ${height}px contra ${expected}px de ${token}`,
        ).toBeLessThanOrEqual(0.5);
      }
    });

    await step('As larguras decrescem na ordem declarada', async () => {
      // É a asserção que faltava: o tradutor de classe utilitária descartava
      // `w-[60%]` em silêncio e as três linhas saíam do mesmo tamanho.
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
