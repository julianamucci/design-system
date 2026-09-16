import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { badgeRoot } from '@shared/testing/badge-probe';
import { Badge } from './index';
import BadgeDocs from '@/components/docs/BadgeDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { badgeSource } from './badge.source';

const meta = {
  title: 'Components/Feedback/Badge',
  component: Badge,
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('badge'),
    actions: { disable: true },
    layout: 'centered',
    docs: { page: withAutoDocsTab(BadgeDocs), source: { transform: badgeSource } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
      description: 'Variante visual nativa do Badge',
      table: { defaultValue: { summary: 'default' } },
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  // A transform é declarada AQUI, e não herdada do `meta`: herança acerta por
  // coincidência, e no dia em que o `meta` trocar de transform esta story passa
  // a publicar outro exemplo sem ninguém ver.
  parameters: {
    covers: ['accessibility.item1', 'visual.item1'],
    docs: { source: { transform: badgeSource } },
  },
  render: (args) => ({
    components: { Badge },
    // Na variante padrão a prop NÃO é passada: a play cobra que a etiqueta
    // declare `data-variant="default"` quando ninguém escreveu variante — era
    // exatamente o caso que ficava sem atributo. O painel Code sai do
    // `badgeSource`, então este andaime não vaza.
    setup() {
      const bound = () => (args.variant === 'default' ? {} : args);
      return { bound };
    },
    template: `<Badge v-bind="bound()">Novo</Badge>`,
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const badge = badgeRoot(canvasElement);
    await expect(canvas.getByText('Novo')).toBe(badge);

    await step('A variante chega ao DOM, mesmo quando não foi passada', async () => {
      await expect(badge).toHaveAttribute('data-slot', 'badge');
      await expect(badge).toHaveAttribute('data-variant', args.variant ?? 'default');
    });

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido.
      await expect(badge.tagName).toBe('SPAN');
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const styles = getComputedStyle(badge);
      await expect(styles.display).toBe('inline-flex');
      await expect(styles.whiteSpace).toBe('nowrap');
      // Etiqueta não é alvo de foco: quem precisa de interação a envolve.
      await expect(badge.hasAttribute('tabindex')).toBe(false);
    });

    await step('Tipografia compacta do componente', async () => {
      const styles = getComputedStyle(badge);
      await expect(styles.fontSize).toBe('12px');
      await expect(Number(styles.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
