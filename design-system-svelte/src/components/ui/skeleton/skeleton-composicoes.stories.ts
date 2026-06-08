import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import SkeletonComposicaoStory from './SkeletonComposicaoStory.svelte';

const meta = {
  title: 'UI/Skeleton/Composicoes',
  component: SkeletonComposicaoStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes comuns: card de perfil, lista com avatar, imagem em AspectRatio e parágrafo. Cada Skeleton recebe aria-hidden e o container recebe aria-busy + aria-label.',
      },
    },
  },
} satisfies Meta<typeof SkeletonComposicaoStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardDePerfil: Story = {
  args: { variant: 'cardDePerfil' },
  parameters: {
    docs: {
      description: {
        story: 'Card de perfil com avatar circular + 2 linhas de texto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Container possui aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });
    await step('Renderiza 3 Skeletons (avatar + 2 linhas)', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
    });
    await step('Avatar usa rounded-full', async () => {
      const avatar = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(avatar.className).toMatch(/rounded-full/);
    });
    await step('Todos os Skeletons possuem aria-hidden=true', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      skeletons.forEach((sk) => {
        expect(sk.getAttribute('aria-hidden')).toBe('true');
      });
    });
  },
};

export const ListaComAvatar: Story = {
  args: { variant: 'listaComAvatar' },
  parameters: {
    docs: {
      description: {
        story: 'Lista com 5 itens — cada um com avatar circular e 2 linhas curtas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Container possui aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });
    await step('Renderiza 15 Skeletons (5 itens × 3 elementos)', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(15);
    });
    await step('motion-reduce aplicado em todos', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      skeletons.forEach((sk) => {
        expect((sk as HTMLElement).className).toMatch(/motion-reduce:animate-none/);
      });
    });
  },
};

export const ImagemEmAspectRatio: Story = {
  args: { variant: 'imagemEmAspectRatio' },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton ocupando 100% de um container com aspect-ratio 16/9.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Container possui aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });
    await step('Skeleton ocupa h-full w-full', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(sk).toBeInTheDocument();
      await expect(sk.className).toMatch(/h-full/);
      await expect(sk.className).toMatch(/w-full/);
    });
  },
};

export const Paragrafo: Story = {
  args: { variant: 'paragrafo' },
  parameters: {
    docs: {
      description: {
        story: '3 linhas de Skeleton com larguras decrescentes (100% / 90% / 75%) simulando parágrafo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Container possui aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });
    await step('Renderiza 3 linhas Skeleton', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
    });
  },
};
