import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createBadge, type BadgeVariant } from './badge';
import { badgeSource } from './badge.source';
import { createBadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

const meta: Meta<BadgeArgs> = {
  title: 'Components/Feedback/Badge',
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('badge'),
    docs: {
      page: withAutoDocsTab(createBadgeDocs),
      source: { transform: badgeSource },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
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

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido. Só o Angular afirmava
      // isso — e era justamente a stack que sobrava que renderizava <div>.
      await expect(badge.tagName).toBe('SPAN');
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const style = getComputedStyle(badge);
      await expect(style.display).toBe('inline-flex');
      await expect(style.whiteSpace).toBe('nowrap');
    });

    await step('Tipografia compacta do componente', async () => {
      const style = getComputedStyle(badge);
      await expect(style.fontSize).toBe('12px');
      await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
