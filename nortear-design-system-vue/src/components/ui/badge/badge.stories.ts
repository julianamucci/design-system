import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeDocs from '@/components/docs/BadgeDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { badgeSource } from './badge.source';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('badge'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(BadgeDocs), source: { transform: badgeSource } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
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

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido. Só o Angular afirmava
      // isso — e era justamente a stack que sobrava que renderizava <div>.
      await expect(badge.tagName).toBe('SPAN');
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const styles = getComputedStyle(badge);
      await expect(styles.display).toBe('inline-flex');
      await expect(styles.whiteSpace).toBe('nowrap');
    });

    await step('Tipografia compacta do componente', async () => {
      const styles = getComputedStyle(badge);
      await expect(styles.fontSize).toBe('12px');
      await expect(Number(styles.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
