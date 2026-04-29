import type { Meta, StoryObj } from '@storybook/svelte';
import SeparatorStory from './SeparatorStory.svelte';

const meta = {
  title: 'UI/Separator/Variantes',
  component: SeparatorStory,
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
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    decorative: true,
  },
};
