import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';

const meta: Meta = {
  title: 'UI/Separator/Variants',
  component: SeparatorStory,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de orientação: horizontal (h-px w-full) e vertical (w-px h-full em flex container).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator horizontal presente com data-slot', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toBeInTheDocument();
    });
    await step('data-orientation="horizontal"', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });
    await step('Dimensões horizontais (1px de altura, largura total)', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]') as HTMLElement;
      await expect(sep).toHaveClass('nds-separator');
      await expect(getComputedStyle(sep).height).toBe('1px');
    });
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    decorative: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator vertical presente com data-slot', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toBeInTheDocument();
    });
    await step('data-orientation="vertical"', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toHaveAttribute('data-orientation', 'vertical');
    });
    await step('Dimensões verticais (1px de largura)', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]') as HTMLElement;
      await expect(sep).toHaveClass('nds-separator');
      await expect(getComputedStyle(sep).width).toBe('1px');
    });
  },
};
