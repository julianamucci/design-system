import type { Meta, StoryObj } from '@storybook/svelte';
import SeparatorStory from './SeparatorStory.svelte';

const meta = {
  title: 'UI/Separator/Estados',
  component: SeparatorStory,
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
};

export const Semantico: Story = {
  args: {
    orientation: 'horizontal',
    decorative: false,
  },
};
