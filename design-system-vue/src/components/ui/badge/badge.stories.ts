import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeDocs from '@/components/docs/BadgeDocs.vue';
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
    components: { Badge },
    setup() { return { args }; },
    template: `<Badge v-bind="args">Novo</Badge>`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Badge renderiza o texto', async () => {
      await expect(canvas.getByText('Novo')).toBeVisible();
    });

    await step('Variante default aplica classes primary', async () => {
      const badge = canvas.getByText('Novo');
      await expect(badge).toHaveClass('bg-primary');
      await expect(badge).toHaveClass('text-primary-foreground');
    });

    await step('Badge é inline-flex', async () => {
      const badge = canvas.getByText('Novo');
      await expect(badge).toHaveClass('inline-flex');
    });
  },
};
