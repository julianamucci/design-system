import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeDocs from '@/components/docs/BadgeDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(BadgeDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Variante visual nativa do Badge',
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: BadgeStory,
    props: {
      variant: args.variant,
      label: 'Novo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Badge renderiza texto corretamente', async () => {
      await expect(canvas.getByText('Novo')).toBeVisible();
    });

    await step('Badge possui data-slot="badge"', async () => {
      const el = canvasElement.querySelector('[data-slot="badge"]');
      await expect(el).not.toBeNull();
    });
  },
};
