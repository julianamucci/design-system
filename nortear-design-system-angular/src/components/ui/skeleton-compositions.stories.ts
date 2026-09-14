import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SKELETON } from './skeleton';
import { NdsAspectRatio } from './aspect-ratio';
import {
  skeletonImageRatioSource,
  skeletonListWithAvatarSource,
  skeletonParagraphSource,
  skeletonProfileCardSource,
} from './skeleton.source';
import { boxDesenhada, heightAgainstToken } from '@shared/testing/skeleton-probe';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/Compositions',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_SKELETON, NdsAspectRatio] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco é UMA região de carregamento, e cada placeholder fica fora da árvore de acessibilidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** A peça de região da story: papel, estado e nome vêm da diretiva. */
async function expectRegion(canvasElement: HTMLElement, label: string): Promise<HTMLElement> {
  const region = canvasElement.querySelector<HTMLElement>('[ndsSkeletonRegion]')!;
  await expect(region).not.toBeNull();
  await expect(region).toHaveAttribute('role', 'status');
  await expect(region).toHaveAttribute('aria-busy', 'true');
  await expect(region).toHaveAccessibleName(label);
  return region;
}

export const ProfileCard: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: skeletonProfileCardSource },
      description: {
        story: 'Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.',
      },
    },
  },
  render: () => ({
    template: `
      <div
        ndsSkeletonRegion
        label="Carregando card de perfil"
        class="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
        data-align="center"
        data-spacing="md"
      >
        <div ndsSkeleton data-shape="avatar"></div>
        <!-- nds-flex-1 não é enfeite: sem base de largura a pilha encolhe para
             o conteúdo, as frações resolvem para zero e as linhas somem. -->
        <div class="nds-stack nds-flex-1" data-spacing="sm">
          <div ndsSkeleton data-shape="text" data-width="2-3"></div>
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('.nds-skeleton')];

    await step('A região tem papel, estado e nome', async () => {
      await expectRegion(canvasElement, 'Carregando card de perfil');
    });

    await step('Avatar + duas linhas, todos fora da árvore de acessibilidade', async () => {
      await expect(parts).toHaveLength(3);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar é quadrado e as linhas têm larguras diferentes', async () => {
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
      // A região embrulha a LISTA inteira: uma por item repetiria o aviso cinco vezes.
      source: { transform: skeletonListWithAvatarSource },
      description: {
        story: 'Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.',
      },
    },
  },
  render: () => ({
    props: { items: [1, 2, 3, 4, 5] },
    template: `
      <div ndsSkeletonRegion label="Carregando lista de pedidos" class="nds-w-md">
        <!-- role="list" devolve a semântica que list-style: none tira em alguns
             leitores de tela. A ul não carrega estado nem nome: é da região. -->
        <ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">
          @for (item of items; track item) {
            <li class="nds-cluster" data-align="center" data-spacing="sm">
              <div ndsSkeleton data-shape="avatar" data-size="sm"></div>
              <div class="nds-stack nds-flex-1" data-spacing="xs">
                <div ndsSkeleton data-shape="text" data-width="2-3"></div>
                <div ndsSkeleton data-shape="text" data-width="1-3"></div>
              </div>
            </li>
          }
        </ul>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('.nds-skeleton')];

    await step('A lista inteira mora dentro de UMA região com nome', async () => {
      const region = await expectRegion(canvasElement, 'Carregando lista de pedidos');
      const list = region.querySelector<HTMLElement>('ul')!;
      await expect(list).not.toBeNull();
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
      // `data-size="sm"` só entrega se a folha responder.
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
      source: { transform: skeletonImageRatioSource },
      description: {
        story:
          'Placeholder de imagem dentro de uma proporção 16/9 — quem define a caixa é o container.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsSkeletonRegion label="Carregando imagem" class="nds-w-sm">
        <div ndsAspectRatio [ratio]="16 / 9">
          <div ndsSkeleton data-shape="fill"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const box = canvasElement.querySelector<HTMLElement>('.nds-aspect-ratio')!;
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;

    await step('A região de carregamento tem estado e nome', async () => {
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
      source: { transform: skeletonParagraphSource },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsSkeletonRegion label="Carregando parágrafo" class="nds-stack nds-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
        <div ndsSkeleton data-shape="text" data-width="1-2"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('.nds-skeleton')];

    await step('A região tem papel, estado e nome', async () => {
      await expectRegion(canvasElement, 'Carregando parágrafo');
    });

    await step('Três linhas, ocultas ao leitor de tela', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) await expect(l).toHaveAttribute('aria-hidden', 'true');
    });

    await step('A altura de cada linha é a do token da escada de texto', async () => {
      // A sonda mexe no DOM: fora de `waitFor`.
      for (const l of lines) {
        const { token, height, expected } = heightAgainstToken(l);
        await expect(
          Math.abs(height - expected),
          `linha mediu ${height}px contra ${expected}px de ${token}`,
        ).toBeLessThanOrEqual(0.5);
      }
    });

    await step('As larguras decrescem — é o que faz o bloco parecer parágrafo', async () => {
      const widths = lines.map((l) => l.getBoundingClientRect().width);
      await expect(widths[0]).toBeGreaterThan(widths[1]);
      await expect(widths[1]).toBeGreaterThan(widths[2]);
    });
  },
};
