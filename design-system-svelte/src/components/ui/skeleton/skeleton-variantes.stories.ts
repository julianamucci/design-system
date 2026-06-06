import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import SkeletonStory from './SkeletonStory.svelte';

const meta = {
  title: 'UI/Skeleton/Variantes',
  component: SkeletonStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Skeleton — Retângulo, Círculo e Linha de texto. A forma é controlada por className (rounded-md, rounded-full, h-4 w-[200px]).',
      },
    },
  },
} satisfies Meta<typeof SkeletonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Retangulo: Story = {
  args: { class: 'h-20 w-64' },
  parameters: {
    docs: {
      description: {
        story: 'Padrão `rounded-md` com `h-20 w-64` — placeholder para imagens, cards e blocos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Aplica classes de retângulo (h-20 w-64 rounded-md)', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(sk).toBeInTheDocument();
      await expect(sk.className).toMatch(/h-20/);
      await expect(sk.className).toMatch(/w-64/);
      await expect(sk.className).toMatch(/rounded-md/);
    });
  },
};

export const Circulo: Story = {
  args: { class: 'h-12 w-12 rounded-full' },
  parameters: {
    docs: {
      description: {
        story: 'Combinado com `rounded-full` (`h-12 w-12`) — placeholder para avatares e ícones circulares.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Aplica classes de círculo (h-12 w-12 rounded-full)', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(sk).toBeInTheDocument();
      await expect(sk.className).toMatch(/h-12/);
      await expect(sk.className).toMatch(/w-12/);
      await expect(sk.className).toMatch(/rounded-full/);
    });
  },
};

export const LinhaDeTexto: Story = {
  args: { class: 'h-4 w-[200px]' },
  parameters: {
    docs: {
      description: {
        story: 'Altura fixa (`h-4`) com largura definida (`w-[200px]`) — placeholder para linhas de texto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Aplica classes de linha (h-4 w-[200px])', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(sk).toBeInTheDocument();
      await expect(sk.className).toMatch(/h-4/);
      await expect(sk.className).toMatch(/w-\[200px\]/);
    });
  },
};
