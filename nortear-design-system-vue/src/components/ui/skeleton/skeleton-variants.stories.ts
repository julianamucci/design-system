import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton, SkeletonRegion } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  avatarIgnoresWidth,
  boxDesenhada,
  heightAgainstToken,
} from '@shared/testing/skeleton-probe';
import {
  skeletonCircleSource,
  skeletonLineTextSource,
  skeletonRectangleSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/Variants',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonRectangleSource },
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
      // Transform próprio, e não o herdado do meta: a story diz o que publica
      // mesmo se o meta passar a mostrar outra forma.
      source: { transform: skeletonRectangleSource },
      description: {
        story:
          '`data-shape="fill"` preenche a caixa que o container estabelece — aqui, uma proporção de mídia 16/9.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion, AspectRatio },
    template: `
      <SkeletonRegion label="Carregando bloco" class="nds-w-sm">
        <AspectRatio :ratio="16 / 9">
          <Skeleton data-shape="fill" />
        </AspectRatio>
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

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
      // Outra forma e sem container de proporção: `avatar` traz medida própria,
      // ao contrário do `fill` que o meta mostra.
      source: { transform: skeletonCircleSource },
      description: {
        story:
          '`data-shape="avatar"` é a exceção que a guideline 12 prevê: peça sem fluxo de texto tem medida, e ela vem da escada `--size-*`.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando avatar">
        <Skeleton data-shape="avatar" />
      </SkeletonRegion>
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

    await step('Com data-width, o avatar continua quadrado', async () => {
      // A fração de largura é das formas de texto; antes da restrição na folha
      // o avatar saía retângulo. Fora de `waitFor` — a sonda mexe no atributo.
      await expect(avatarIgnoresWidth(sk).quadrado).toBe(true);
    });
  },
};

export const TextLine: Story = {
  parameters: {
    covers: ['functional.item2'],
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
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando linhas de texto" class="nds-stack nds-w-sm" data-spacing="sm">
        <Skeleton data-shape="text" data-width="full" />
        <Skeleton data-shape="text" data-width="3-4" />
        <Skeleton data-shape="text" data-width="1-2" />
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]'),
    ];

    await step('Três linhas, com a altura do token de texto', async () => {
      // `height > 0` pegava só o colapso; altura cravada por fora e desvio da
      // escada passavam. Medida resolvida no contexto do elemento, fora de
      // `waitFor` — a sonda pendura um nó.
      await expect(lines).toHaveLength(3);
      for (const l of lines) {
        const { height, expected } = heightAgainstToken(l);
        await expect(expected).toBeGreaterThan(0);
        await expect(Math.abs(height - expected)).toBeLessThanOrEqual(0.5);
      }
    });

    await step('As larguras decrescem na ordem declarada', async () => {
      // É a asserção que faltava: com `w-[250px]` inerte as três saíam iguais.
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
