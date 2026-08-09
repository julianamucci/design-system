import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsButton, type ButtonVariant } from './button';

const VARIANTES: { variant: ButtonVariant; label: string }[] = [
  { variant: 'default',     label: 'Default'     },
  { variant: 'secondary',   label: 'Secondary'   },
  { variant: 'outline',     label: 'Outline'     },
  { variant: 'ghost',       label: 'Ghost'       },
  { variant: 'link',        label: 'Link'        },
  { variant: 'destructive', label: 'Destructive' },
];

const meta: Meta = {
  title: 'UI/Button/Variantes',
  decorators: [moduleMetadata({ imports: [NdsButton] })],
  parameters: {
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Variantes: Story = {
  render: () => ({
    props: { variantes: VARIANTES },
    template: `
      <div style="display:flex; gap:.75rem; flex-wrap:wrap; align-items:center">
        @for (v of variantes; track v.variant) {
          <button ndsButton [variant]="v.variant">{{ v.label }}</button>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante recebe a classe .nds-button-<variante>', async () => {
      // Esta é a asserção que prova o binding de input: se `[variant]` não
      // chegasse ao componente, todos cairiam em `nds-button-default` e só a
      // primeira linha passaria.
      for (const { variant, label } of VARIANTES) {
        const btn = canvas.getByRole('button', { name: label });
        await expect(btn).toHaveClass(`nds-button nds-button-${variant}`);
      }
    });
  },
};
