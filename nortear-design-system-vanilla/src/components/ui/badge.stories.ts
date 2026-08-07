import type { Meta, StoryObj } from '@storybook/html-vite';
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
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: (args) => createBadge({ variant: args.variant, children: args.label }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(args.label);

    await step('Os controls chegam ao elemento', async () => {
      await expect(badge).toHaveAttribute('data-slot', 'badge');
      await expect(badge).toHaveAttribute('data-variant', String(args.variant));
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const estilo = getComputedStyle(badge);
      await expect(estilo.display).toBe('inline-flex');
      await expect(estilo.whiteSpace).toBe('nowrap');
    });

    await step('Tipografia compacta do componente', async () => {
      const estilo = getComputedStyle(badge);
      await expect(estilo.fontSize).toBe('12px');
      await expect(Number(estilo.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
