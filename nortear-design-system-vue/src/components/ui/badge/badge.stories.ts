import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: (args) => ({
    components: { Badge },
    setup() { return { args }; },
    template: `<Badge v-bind="args">Novo</Badge>`,
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
