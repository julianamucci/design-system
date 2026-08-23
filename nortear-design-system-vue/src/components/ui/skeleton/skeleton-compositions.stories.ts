import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { boxDesenhada } from '@shared/testing/skeleton-probe';
import {
  skeletonCardPerfilSource,
  skeletonImageRatioSource,
  skeletonListSource,
  skeletonParagrafoSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'UI/Skeleton/Compositions',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonCardPerfilSource },
      description: {
        component:
          'Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco é uma região `role="status"` com `aria-busy`, e cada placeholder fica fora da árvore de acessibilidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileCard: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story: 'Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando card de perfil"
        class="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
        data-align="center"
        data-spacing="md"
      >
        <Skeleton data-shape="avatar" />
        <div class="nds-stack nds-flex-1" data-spacing="sm">
          <Skeleton data-shape="text" data-width="2-3" />
          <Skeleton data-shape="text" data-width="1-2" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem papel, estado e nome', async () => {
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Avatar + duas linhas, todos fora da árvore de acessibilidade', async () => {
      await expect(parts).toHaveLength(3);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar é circular e as linhas têm larguras diferentes', async () => {
      await expect(boxDesenhada(parts[0]).quadrado).toBe(true);
      await expect(parts[1].getBoundingClientRect().width).toBeGreaterThan(
        parts[2].getBoundingClientRect().width,
      );
    });
  },
};

export const ListWithAvatar: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // A região ocupada passa a ser a própria lista, com `v-for` no item — não
      // é outro valor de atributo, é outra estrutura.
      source: { transform: skeletonListSource },
      description: {
        story: 'Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <ul
        role="list"
        aria-busy="true"
        aria-label="Carregando lista de pedidos"
        class="nds-stack nds-list-none nds-p-0 nds-w-md"
        data-spacing="md"
      >
        <li v-for="i in 5" :key="i" class="nds-cluster" data-align="center" data-spacing="sm">
          <Skeleton data-shape="avatar" data-size="sm" />
          <div class="nds-stack nds-flex-1" data-spacing="xs">
            <Skeleton data-shape="text" data-width="2-3" />
            <Skeleton data-shape="text" data-width="1-3" />
          </div>
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lista = canvasElement.querySelector('ul') as HTMLElement;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A lista inteira é uma região ocupada, com nome', async () => {
      await expect(lista).toHaveAttribute('aria-busy', 'true');
      await expect(lista.getAttribute('aria-label')).toBeTruthy();
      await expect(lista.querySelectorAll('li')).toHaveLength(5);
    });

    await step('Cinco itens de três peças, todas ocultas ao leitor', async () => {
      await expect(parts).toHaveLength(15);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar pequeno continua quadrado e com medida do tema', async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const caixa = boxDesenhada(parts[0]);
      await expect(caixa.quadrado).toBe(true);
      await expect(caixa.largura).toBeGreaterThan(0);
    });
  },
};

export const ImageInAspectRatio: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // Entra outro componente do design system para dar a caixa ao `fill`; o
      // snippet do meta não teria de onde tirar o import.
      source: { transform: skeletonImageRatioSource },
      description: {
        story:
          'Placeholder de imagem dentro de uma proporção 16/9 — quem define a caixa é o container.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, AspectRatio },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando imagem" class="nds-w-sm">
        <AspectRatio :ratio="16 / 9">
          <Skeleton data-shape="fill" />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('A região de carregamento tem estado e nome', async () => {
      const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('O placeholder preenche a caixa proporcional', async () => {
      // Se o filho perdesse o `inset: 0`, a proporção continuaria certa e a
      // caixa ficaria vazia — só a medição acusa.
      const c = caixa.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
    });
  },
};

export const Paragraph: Story = {
  parameters: {
    docs: {
      // Só linhas, sem avatar: a lição é a queda de largura entre elas.
      source: { transform: skeletonParagrafoSource },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando parágrafo"
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
    const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem estado e nome', async () => {
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Três linhas, ocultas ao leitor de tela', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l).toHaveAttribute('aria-hidden', 'true');
    });

    await step('As larguras decrescem — é o que faz o bloco parecer parágrafo', async () => {
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
