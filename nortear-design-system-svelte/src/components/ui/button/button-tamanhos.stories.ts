import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Tamanhos',
  component: Button,
  tags: ['form'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'default', label: 'Padrão' } }),
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Tamanho padrão. Use em formulários e diálogos como default.' } },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /padrão/i });
    await expect(btn).toHaveClass('nds-button');
    await expect(btn).not.toHaveClass('nds-button-sm');
    await expect(btn).not.toHaveClass('nds-button-lg');
  },
};

export const Small: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'sm', label: 'Pequeno' } }),
  parameters: { docs: { description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /pequeno/i });
    await expect(btn).toHaveClass('nds-button-sm');
  },
};

export const Large: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'lg', label: 'Grande' } }),
  parameters: { docs: { description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /grande/i });
    await expect(btn).toHaveClass('nds-button-lg');
  },
};

const iconAriaLabelPlay: Story['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  await step('Botão icon-only é acessível via aria-label', async () => {
    const button = canvas.getByRole('button', { name: 'Adicionar item' });
    await expect(button).toBeInTheDocument();
  });
};

export const Icon: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: {
    covers: ['functional.item6', 'accessibility.item4'],
    docs: { description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' } },
  },
  play: iconAriaLabelPlay,
};

export const IconSmall: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon-sm', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: { docs: { description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' } } },
  play: iconAriaLabelPlay,
};

export const IconLarge: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon-lg', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: { docs: { description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' } } },
  play: iconAriaLabelPlay,
};
