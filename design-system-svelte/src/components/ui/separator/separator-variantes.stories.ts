import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';

const meta = {
  title: 'UI/Separator/Variantes',
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
} satisfies Meta<typeof SeparatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    await step('Classes de dimensão horizontal (h-px + w-full)', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]') as HTMLElement;
      await expect(sep.className).toMatch(/data-\[orientation=horizontal\]:h-px/);
      await expect(sep.className).toMatch(/data-\[orientation=horizontal\]:w-full/);
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
    await step('Classes de dimensão vertical (w-px + h-full)', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]') as HTMLElement;
      await expect(sep.className).toMatch(/data-\[orientation=vertical\]:w-px/);
      await expect(sep.className).toMatch(/data-\[orientation=vertical\]:h-full/);
    });
  },
};
