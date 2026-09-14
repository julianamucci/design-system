import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton, SkeletonRegion } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { boxDesenhada, heightAgainstToken } from '@shared/testing/skeleton-probe';
import {
  skeletonImageRatioSource,
  skeletonListSource,
  skeletonParagraphSource,
  skeletonProfileCardSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/Compositions',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: skeletonProfileCardSource },
      description: {
        component:
          'Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco fica dentro da peça de região, que anuncia o carregamento, e cada placeholder fica fora da árvore de acessibilidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A peça de região da story — o trio papel/estado/nome, conferido por inteiro.
 * Um helper só para as quatro composições: escrito à mão, cada story afirmava
 * um pedaço diferente do trio.
 */
async function expectRegion(canvasElement: HTMLElement, label: string): Promise<HTMLElement> {
  const regiao = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton-region"]')!;
  await expect(regiao).not.toBeNull();
  await expect(regiao).toHaveAttribute('role', 'status');
  await expect(regiao).toHaveAttribute('aria-busy', 'true');
  await expect(regiao).toHaveAccessibleName(label);
  return regiao;
}

export const ProfileCard: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Transform próprio, e não o herdado do meta: a story diz o que publica
      // mesmo se o meta passar a mostrar outra composição.
      source: { transform: skeletonProfileCardSource },
      description: {
        story: 'Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion
        label="Carregando card de perfil"
        class="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
        data-spacing="md"
        data-align="center"
      >
        <Skeleton data-shape="avatar" />
        <div class="nds-stack nds-flex-1" data-spacing="sm">
          <Skeleton data-shape="text" data-width="2-3" />
          <Skeleton data-shape="text" data-width="1-2" />
        </div>
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem papel, estado e nome', async () => {
      await expectRegion(canvasElement, 'Carregando card de perfil');
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
      // A lista entra DENTRO da peça, com `v-for` no item — não é outro valor de
      // atributo, é outra estrutura.
      source: { transform: skeletonListSource },
      description: {
        story: 'Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando lista de pedidos" class="nds-w-md">
        <ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">
          <li v-for="i in 5" :key="i" class="nds-cluster" data-align="center" data-spacing="sm">
            <Skeleton data-shape="avatar" data-size="sm" />
            <div class="nds-stack nds-flex-1" data-spacing="xs">
              <Skeleton data-shape="text" data-width="2-3" />
              <Skeleton data-shape="text" data-width="1-3" />
            </div>
          </li>
        </ul>
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const list = canvasElement.querySelector('ul') as HTMLElement;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A lista inteira fica dentro de UMA região, com nome', async () => {
      const regiao = await expectRegion(canvasElement, 'Carregando lista de pedidos');
      await expect(regiao.contains(list)).toBe(true);
    });

    await step('A lista mantém o papel e não carrega estado nem nome', async () => {
      // Estado e nome são da região; repetidos na `ul`, o leitor anunciaria a
      // espera duas vezes.
      await expect(list).toHaveAttribute('role', 'list');
      await expect(list).not.toHaveAttribute('aria-busy');
      await expect(list).not.toHaveAttribute('aria-label');
      await expect(list.querySelectorAll('li')).toHaveLength(5);
    });

    await step('Cinco itens de três peças, todas ocultas ao leitor', async () => {
      await expect(parts).toHaveLength(15);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar pequeno continua quadrado e com medida do tema', async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const box = boxDesenhada(parts[0]);
      await expect(box.quadrado).toBe(true);
      await expect(box.width).toBeGreaterThan(0);
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
    components: { Skeleton, SkeletonRegion, AspectRatio },
    template: `
      <SkeletonRegion label="Carregando imagem" class="nds-w-sm">
        <AspectRatio :ratio="16 / 9">
          <Skeleton data-shape="fill" />
        </AspectRatio>
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('A região de carregamento tem papel, estado e nome', async () => {
      await expectRegion(canvasElement, 'Carregando imagem');
    });

    await step('O placeholder preenche a caixa proporcional', async () => {
      // Se o filho perdesse o `inset: 0`, a proporção continuaria certa e a
      // caixa ficaria vazia — só a medição acusa.
      const c = box.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
    });
  },
};

export const Paragraph: Story = {
  parameters: {
    covers: ['functional.item2', 'functional.item3', 'functional.item4'],
    docs: {
      // Só linhas, sem avatar: a lição é a queda de largura entre elas.
      source: { transform: skeletonParagraphSource },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  render: () => ({
    components: { Skeleton, SkeletonRegion },
    template: `
      <SkeletonRegion label="Carregando parágrafo" class="nds-stack nds-w-sm" data-spacing="sm">
        <Skeleton data-shape="text" data-width="full" />
        <Skeleton data-shape="text" data-width="3-4" />
        <Skeleton data-shape="text" data-width="1-2" />
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    // functional.item4: a região expõe papel, estado e nome.
    await step('A região tem papel, estado e nome', async () => {
      await expectRegion(canvasElement, 'Carregando parágrafo');
    });

    await step('Três linhas, ocultas ao leitor de tela', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Cada linha tem a altura do token de texto', async () => {
      // Fora de `waitFor`: a sonda pendura um nó para resolver o token.
      for (const l of lines) {
        const { height, expected } = heightAgainstToken(l);
        await expect(expected).toBeGreaterThan(0);
        await expect(Math.abs(height - expected)).toBeLessThanOrEqual(0.5);
      }
    });

    await step('As larguras decrescem — é o que faz o bloco parecer parágrafo', async () => {
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
