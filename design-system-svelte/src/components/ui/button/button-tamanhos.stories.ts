import type { Meta, StoryObj } from '@storybook/svelte';
import { within, expect } from 'storybook/test';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  title: 'UI/Button/Tamanhos',
  component: ButtonStory,
  args: {
    variant: 'default',
    disabled: false,
    label: 'Botão',
  },
} satisfies Meta<typeof ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'sm' },
  parameters: {
    docs: {
      description: {
        story: 'Tamanho compacto (h-8) para contextos com espaço reduzido — toolbars, tabelas e cards densos.',
      },
    },
  },
};

export const Default: Story = {
  args: { size: 'default' },
  parameters: {
    docs: {
      description: {
        story: 'Tamanho padrão (h-9). Adequado para a maioria dos contextos de interface.',
      },
    },
  },
};

export const Large: Story = {
  args: { size: 'lg' },
  parameters: {
    docs: {
      description: {
        story: 'Tamanho expandido (h-10) para CTAs de destaque — hero sections e landing pages.',
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Fechar',
    label: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão icon-only possui aria-label acessível', async () => {
      const button = canvas.getByRole('button', { name: 'Fechar' });
      await expect(button).toHaveAttribute('aria-label', 'Fechar');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tamanho quadrado (size-9). **Obrigatório** passar `aria-label` descritivo — sem ele o botão é inacessível para leitores de tela.',
      },
    },
  },
};
