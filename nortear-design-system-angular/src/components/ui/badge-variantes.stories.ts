import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsBadge, type BadgeVariant } from './badge';

const VARIANTES: { variant: BadgeVariant; label: string }[] = [
  { variant: 'default',     label: 'Default'     },
  { variant: 'secondary',   label: 'Secondary'   },
  { variant: 'destructive', label: 'Destructive' },
  { variant: 'warning',     label: 'Warning'     },
  { variant: 'success',     label: 'Success'     },
  { variant: 'info',        label: 'Info'        },
  { variant: 'outline',     label: 'Outline'     },
];

const meta: Meta = {
  title: 'UI/Badge/Variants',
  decorators: [moduleMetadata({ imports: [NdsBadge] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Variants: Story = {
  parameters: {
    // Uma story cobre as sete variantes de uma vez: é o conjunto lado a lado
    // que a regressão visual compara, e é nele que a diferença de cor aparece.
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item7', 'visual.item1', 'visual.item2', 'visual.item5',
      'accessibility.item2', 'accessibility.item3',
    ],
  },
  render: () => ({
    props: { variantes: VARIANTES },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        @for (v of variantes; track v.variant) {
          <span ndsBadge [variant]="v.variant">{{ v.label }}</span>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante recebe a própria classe', async () => {
      // Sem AOT o binding cai em silêncio no default e as sete ficariam
      // iguais — esta é a asserção que impede o NG0303 de voltar despercebido.
      for (const { variant, label } of VARIANTES) {
        const badge = canvas.getByText(label);
        await expect(badge).toHaveAttribute('data-variant', variant);
        if (variant !== 'default') {
          await expect(badge).toHaveClass(new RegExp(`nds-badge-${variant}`));
        }
      }
    });

    await step('As variantes semânticas não repetem a mesma cor', async () => {
      // O que separa warning de success de destructive é a cor. Se um token
      // sumir do CSS, as classes continuam certas e só a medição acusa.
      const cores = new Set(
        ['Destructive', 'Warning', 'Success', 'Info'].map((l) =>
          getComputedStyle(canvas.getByText(l)).backgroundColor,
        ),
      );
      await expect(cores.size).toBe(4);
    });
  },
};
