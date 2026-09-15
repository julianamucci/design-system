import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { badgeRoot } from '@shared/testing/badge-probe';
import { NdsBadge } from './badge';
import { badgePlaygroundSource, LABEL, type BadgeArgs } from './badge.source';
import { NdsBadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<BadgeArgs> = {
  title: 'Components/Feedback/Badge',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [NdsBadge] })],
  parameters: {
    design: figmaDesign('badge'),
    actions: { disable: true },
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsBadgeDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
      description: 'Variante visual do Badge.',
    },
    label: { control: 'text', description: 'Rótulo curto exibido no Badge.' },
  },
  args: { variant: 'default', label: LABEL.default() },
};

export default meta;
type Story = StoryObj<BadgeArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: badgePlaygroundSource } },
    covers: ['accessibility.item1', 'visual.item1'],
  },
  render: (args) => ({
    props: { ...args },
    // Com a variante no padrão o template NÃO liga `variant`: é o que prova, no
    // passo abaixo, que a etiqueta declara `data-variant="default"` sozinha, sem
    // depender de quem a usa escrever o valor padrão.
    template:
      args.variant && args.variant !== 'default'
        ? `<span ndsBadge [variant]="variant">{{ label }}</span>`
        : `<span ndsBadge>{{ label }}</span>`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const badge = badgeRoot(canvasElement);

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Badge é etiqueta inline. Um <div> aqui quebraria o fluxo do texto.
      await expect(badge.tagName).toBe('SPAN');
      await expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    await step('A variante chega ao DOM — e o padrão também', async () => {
      // Sem variante passada, `data-variant` continua `default`: a sonda e a
      // folha leem o atributo, e ele não pode depender do call site.
      await expect(badge).toHaveAttribute('data-variant', args.variant ?? 'default');
      await expect(badge).toHaveClass(/nds-badge/);
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const style = getComputedStyle(badge);
      await expect(style.display).toBe('inline-flex');
      await expect(style.whiteSpace).toBe('nowrap');
      await expect(badge.textContent?.trim()).toBe(args.label);
    });

    await step('Tipografia compacta do componente', async () => {
      // O corpo de 12px e o peso médio separam a etiqueta do texto ao redor — e
      // a altura nasce daí, nunca de um valor cravado (WCAG 1.4.4).
      const style = getComputedStyle(badge);
      await expect(style.fontSize).toBe('12px');
      await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(500);
    });

    await step('Não é focável — é rótulo, não controle', async () => {
      await expect(badge.hasAttribute('tabindex')).toBe(false);
    });
  },
};
