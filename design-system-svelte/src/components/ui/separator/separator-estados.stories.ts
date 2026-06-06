import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';

const meta = {
  title: 'UI/Separator/Estados',
  component: SeparatorStory,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Modos de acessibilidade: decorativo (role="none" + aria-hidden) e semântico (role="separator" + aria-orientation).',
      },
    },
  },
} satisfies Meta<typeof SeparatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorativo: Story = {
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator decorativo presente', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toBeInTheDocument();
    });
    await step('role="none" + aria-hidden="true"', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toHaveAttribute('role', 'none');
      await expect(sep).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Semantico: Story = {
  args: {
    orientation: 'horizontal',
    decorative: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator semântico presente', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toBeInTheDocument();
    });
    await step('role="separator" + aria-orientation', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
