import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsBadge, type BadgeVariant } from './badge';
import { NdsBadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<BadgeArgs> }): string {
  const { variant = 'default', label = 'Ativo' } = ctx.args ?? {};
  const attrs = variant === 'default' ? '' : ` variant="${variant}"`;
  return `import { NdsBadge } from '@/components/ui/badge';

@Component({
  imports: [NdsBadge],
  template: \`<span ndsBadge${attrs}>${label}</span>\`,
})
export class Exemplo {}`;
}

const meta: Meta<BadgeArgs> = {
  title: 'UI/Badge',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [NdsBadge] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsBadgeDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'warning', 'success', 'info', 'outline'],
      description: 'Variante visual do Badge.',
    },
    label: { control: 'text', description: 'Rótulo curto exibido no Badge.' },
  },
  args: { variant: 'default', label: 'Ativo' },
};

export default meta;
type Story = StoryObj<BadgeArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item1', 'accessibility.item1', 'accessibility.item4'],
  },
  render: (args) => ({
    props: { ...args },
    template: `<span ndsBadge [variant]="variant">{{ label }}</span>`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const _canvas = within(canvasElement);

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Badge é etiqueta inline. Um <div> aqui quebraria o fluxo do texto —
      // e é o que o CSS e as outras quatro stacks assumem.
      const badge = canvasElement.querySelector<HTMLElement>('[data-slot="badge"]')!;
      await expect(badge.tagName).toBe('SPAN');
    });

    await step('A variante escolhida chega ao DOM', async () => {
      const badge = canvasElement.querySelector<HTMLElement>('[data-slot="badge"]')!;
      await expect(badge).toHaveAttribute('data-variant', args.variant);
      await expect(badge).toHaveClass(/nds-badge/);
    });

    await step('Não é focável — é rótulo, não controle', async () => {
      // Se um dia alguém puser tabindex aqui, o Tab passaria a parar num
      // elemento sem ação, que é ruído de navegação por teclado.
      const badge = canvasElement.querySelector<HTMLElement>('[data-slot="badge"]')!;
      await expect(badge.hasAttribute('tabindex')).toBe(false);
    });
  },
};
