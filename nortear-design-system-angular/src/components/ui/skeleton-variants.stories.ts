import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SKELETON } from './skeleton';
import { NdsAspectRatio } from './aspect-ratio';
import {
  skeletonCircleSource,
  skeletonRectangleSource,
  skeletonTextLineSource,
} from './skeleton.source';
import {
  avatarIgnoresWidth,
  boxDesenhada,
  heightAgainstToken,
} from '@shared/testing/skeleton-probe';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/Variants',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_SKELETON, NdsAspectRatio] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Formas do esqueleto. Não há variante por input: a forma vem de `data-shape` e a largura de `data-width`, e a folha de estilo continua dona das medidas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Rectangle: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      // Quem dá a caixa ao `fill` é a proporção — no snippet e na story, que por
      // isso mostram o mesmo exemplo. A classe de mídia da docs page saiu do
      // render em 2026-09-16: ela não é API do design system.
      source: { transform: skeletonRectangleSource },
      description: {
        story:
          '`data-shape="fill"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsSkeletonRegion label="Carregando bloco" class="nds-w-sm">
        <div ndsAspectRatio [ratio]="16 / 9">
          <div ndsSkeleton data-shape="fill"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector<HTMLElement>('.nds-aspect-ratio')!;
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;

    await step('Preenche a caixa que o AspectRatio estabelece', async () => {
      // A proporção é do CONTAINER: medir só o retângulo do esqueleto passava
      // com a classe de docs page que dava a caixa por fora da API.
      const c = caixa.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(c.width).toBeGreaterThan(0);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
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
      source: { transform: skeletonCircleSource },
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsSkeletonRegion label="Carregando avatar">
        <div ndsSkeleton data-shape="avatar"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;

    await step('Quadrado com medida vinda do tema', async () => {
      // Sem número mágico: a medida sai de `--size-*`, que muda por densidade.
      const box = boxDesenhada(sk);
      await expect(box.width).toBeGreaterThan(0);
      await expect(box.quadrado).toBe(true);
    });

    await step('O raio é circular, não o raio padrão do sistema', async () => {
      await expect(boxDesenhada(sk).circular).toBe(true);
    });

    await step('Com fração de largura posta, o avatar continua quadrado', async () => {
      // A folha restringe `data-width` às formas que não são avatar; antes a
      // regra de largura vencia pela ordem e o avatar saía retângulo. A sonda
      // põe o atributo e o devolve como estava — e mexe no DOM: fora de waitFor.
      const box = avatarIgnoresWidth(sk);
      await expect(box.quadrado, `avatar com data-width mediu ${box.width}×${box.height}`).toBe(true);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: skeletonTextLineSource },
      description: {
        story:
          'Altura derivada da escada de texto e largura em fração do container. Variar a largura entre linhas é o que faz o bloco parecer parágrafo.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsSkeletonRegion label="Carregando linhas de texto" class="nds-stack nds-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
        <div ndsSkeleton data-shape="text" data-width="1-2"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('.nds-skeleton')];

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
      const widths = lines.map((l) => l.getBoundingClientRect().width);
      await expect(widths[0]).toBeGreaterThan(widths[1]);
      await expect(widths[1]).toBeGreaterThan(widths[2]);
    });
  },
};
