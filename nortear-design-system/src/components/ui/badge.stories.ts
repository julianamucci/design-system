import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createBadge, type BadgeVariant } from './badge';
import { createBadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

const meta: Meta<BadgeArgs> = {
  title: 'UI/Badge',
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(createBadgeDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Variante visual nativa do Badge',
    },
    label: { control: 'text', description: 'Texto do Badge (1 a 3 palavras)' },
  },
  args: {
    variant: 'default',
    label: 'Novo',
  },
};

export default meta;
type Story = StoryObj<BadgeArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => createBadge({ variant: args.variant, children: args.label }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Badge renderiza com o texto informado', async () => {
      await expect(canvas.getByText(args.label)).toBeVisible();
    });

    await step('Container recebe a classe base .nds-badge', async () => {
      const el = canvasElement.querySelector('.nds-badge');
      await expect(el).not.toBeNull();
    });
  },
};
