import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';
import SeparatorDocs from '@/components/docs/SeparatorDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Separator',
  component: SeparatorStory,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SeparatorDocs),
      description: {
        component:
          'Divisor visual de 1px que separa grupos de conteúdo relacionados em layouts horizontais ou verticais.',
      },
    },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
    },
    decorative: {
      control: { type: 'boolean' },
      description:
        'Quando true, oculta de leitores de tela (role="none" + aria-hidden). Quando false, anuncia como separator.',
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
} satisfies Meta<typeof SeparatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Separator com data-slot está presente', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toBeInTheDocument();
    });

    await step('data-orientation reflete a prop', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]');
      await expect(sep).toHaveAttribute('data-orientation', args.orientation ?? 'horizontal');
    });

    await step('Atributos de acessibilidade conforme decorative', async () => {
      const sep = canvasElement.querySelector('[data-slot="separator"]') as HTMLElement;
      if (args.decorative) {
        await expect(sep).toHaveAttribute('role', 'none');
      } else {
        await expect(sep).toHaveAttribute('role', 'separator');
      }
    });

    void canvas;
  },
};
