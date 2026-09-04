import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsButton, NdsButtonIcon, type ButtonSize } from './button';

const TEXTS: { size: ButtonSize; label: string }[] = [
  { size: 'xs',      label: 'Extra pequeno' },
  { size: 'sm',      label: 'Pequeno'       },
  { size: 'default', label: 'Padrão'        },
  { size: 'lg',      label: 'Grande'        },
];

const ICONS: { size: ButtonSize; label: string }[] = [
  { size: 'icon-xs', label: 'Adicionar (xs)' },
  { size: 'icon-sm', label: 'Adicionar (sm)' },
  { size: 'icon',    label: 'Adicionar'      },
  { size: 'icon-lg', label: 'Adicionar (lg)' },
];

const meta: Meta = {
  title: 'Components/Form/Button/Sizes',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsButton, NdsButtonIcon] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Sizes: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { texts: TEXTS, icons: ICONS },
    template: `
      <div class="nds-stack" data-spacing="lg">
        <div class="nds-cluster" data-spacing="md">
          @for (b of texts; track b.size) {
            <button ndsButton [size]="b.size">{{ b.label }}</button>
          }
        </div>
        <div class="nds-cluster" data-spacing="md">
          @for (b of icons; track b.size) {
            <button ndsButton [size]="b.size" [attr.aria-label]="b.label">
              <svg ndsButtonIcon kind="plus"></svg>
            </button>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada tamanho recebe a classe correspondente', async () => {
      for (const { size, label } of TEXTS) {
        const btn = canvas.getByRole('button', { name: label });
        if (size === 'default') {
          // O tamanho padrão não tem classe própria: o dimensionamento base
          // vive em `.nds-button`. Emitir `nds-button-default` divergiria do
          // Vanilla, que também a omite.
          await expect(btn.className).not.toMatch(/nds-button-(xs|sm|lg)\b/);
        } else {
          await expect(btn).toHaveClass(new RegExp(`nds-button-${size}\\b`));
        }
      }
    });

    await step('Os tamanhos crescem na ordem declarada', async () => {
      // Classe certa com token errado passaria despercebido; a ordem das
      // alturas é o que a pessoa realmente vê.
      const alturas = TEXTS.map(
        ({ label }) => canvas.getByRole('button', { name: label }).getBoundingClientRect().height,
      );
      for (let i = 1; i < alturas.length; i++) {
        await expect(alturas[i]).toBeGreaterThanOrEqual(alturas[i - 1]);
      }
    });

    await step('Os botões icon-only são quadrados', async () => {
      // Peça sem texto tem medida (guideline 12): a escada --size-* dá largura
      // e altura iguais. Um retângulo aqui denuncia padding de texto vazando.
      for (const { label } of ICONS) {
        const btn = canvas.getByRole('button', { name: label });
        const { width, height } = btn.getBoundingClientRect();
        await expect(Math.abs(width - height)).toBeLessThan(2);
      }
    });

    await step('Todo botão icon-only tem nome acessível', async () => {
      for (const { label } of ICONS) {
        await expect(canvas.getByRole('button', { name: label })).toBeTruthy();
      }
    });
  },
};
