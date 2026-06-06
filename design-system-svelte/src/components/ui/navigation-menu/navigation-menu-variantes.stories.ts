import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';

const meta = {
  title: 'UI/NavigationMenu/Variantes',
  component: NavigationMenuStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de orientação do NavigationMenu: horizontal (padrão para headers de site) e vertical (para sidebars ou drawers mobile).',
      },
    },
  },
} satisfies Meta<typeof NavigationMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    ariaLabel: 'Navegação principal',
    demonstration: 'default',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Orientação horizontal — padrão para header de site. Triggers e Content posicionados acima/abaixo.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
    await expect(nav).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    ariaLabel: 'Navegação lateral',
    demonstration: 'default',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Orientação vertical — usada em sidebars ou mobile drawers. Setas Cima/Baixo movem foco entre Triggers.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: /Navegação lateral/i });
    await expect(nav).toBeInTheDocument();
  },
};
