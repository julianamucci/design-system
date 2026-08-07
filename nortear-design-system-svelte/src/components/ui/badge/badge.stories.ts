import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeDocs from '@/components/docs/BadgeDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('badge'),
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
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: (args) => ({
    Component: BadgeStory,
    props: {
      variant: args.variant,
      label: 'Novo',
    },
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');

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
