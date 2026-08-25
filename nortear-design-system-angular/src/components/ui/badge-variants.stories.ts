import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { resolveColor } from '@shared/testing/cor';
import { NdsBadge, type BadgeVariant } from './badge';

const VARIANTS: { variant: BadgeVariant; label: string }[] = [
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
    props: { variantes: VARIANTS },
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
      for (const { variant, label } of VARIANTS) {
        const badge = canvas.getByText(label);
        await expect(badge).toHaveAttribute('data-variant', variant);
        if (variant !== 'default') {
          await expect(badge).toHaveClass(new RegExp(`nds-badge-${variant}`));
        }
      }
    });

    await step('Cada variante pinta a BORDA, e só ela', async () => {
      // O desenho mudou: a etiqueta deixou de ser preenchida. Fundo e texto são
      // neutros nas SETE, e quem carrega a variante é a borda de 2px. Medir
      // "fundo diferente por variante", como esta play fazia, hoje reprovaria o
      // desenho correto — a correção é medir a borda, não afrouxar o teste.
      const BORDER_TOKEN: Record<BadgeVariant, string> = {
        default: '--primary',
        secondary: '--muted-foreground',
        destructive: '--destructive',
        warning: '--warning',
        success: '--success',
        info: '--info',
        outline: '--border',
      };
      // Cor que o TEMA VIGENTE dá ao token, lida de um elemento vivo — nunca um
      // rgb() cravado: trocar de tema não pode reprovar o teste.
      const background = resolveColor(canvasElement, 'hsl(var(--background))');
      const foreground = resolveColor(canvasElement, 'hsl(var(--foreground))');
      for (const { variant, label } of VARIANTS) {
        const style = getComputedStyle(canvas.getByText(label));
        await expect(style.borderTopColor).toBe(
          resolveColor(canvasElement, `hsl(var(${BORDER_TOKEN[variant]}))`),
        );
        await expect(parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(2);
        await expect(style.backgroundColor).toBe(background);
        await expect(style.color).toBe(foreground);
      }
    });

    await step('A secondary usa o neutro que se VÊ', async () => {
      // `--secondary` é cor de fundo, não de traço: medido, como borda não
      // chega a 1.4:1 contra a página e a variante sumiria. É a única cujo
      // token não tem o nome da variante, e por isso o teste cobra os dois
      // lados — o que ela É e o que ela não pode ser.
      const secondaryBorder = getComputedStyle(canvas.getByText('Secondary')).borderTopColor;
      await expect(secondaryBorder).toBe(resolveColor(canvasElement, 'hsl(var(--muted-foreground))'));
      await expect(secondaryBorder).not.toBe(resolveColor(canvasElement, 'hsl(var(--secondary))'));
    });

    await step('As variantes semânticas não repetem a mesma cor', async () => {
      // O que separa warning de success de destructive é a cor da BORDA. Se um
      // token sumir do CSS, as classes continuam certas e só a medição acusa.
      const colors = new Set(
        ['Destructive', 'Warning', 'Success', 'Info'].map((l) =>
          getComputedStyle(canvas.getByText(l)).borderTopColor,
        ),
      );
      await expect(colors.size).toBe(4);
    });
  },
};
