import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';
import { NdsCard } from './card';

const meta: Meta = {
  title: 'UI/Separator/Composições',
  decorators: [moduleMetadata({ imports: [NdsSeparator, NdsCard] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const EmCard: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <nds-card class="nds-p-4 nds-max-w-md">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-semibold">Resumo do pedido</p>
          <div ndsSeparator></div>
          <p class="nds-text-body nds-text-muted-foreground">
            3 itens · entrega em 5 dias úteis
          </p>
        </div>
      </nds-card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separa header e conteúdo dentro do Card', async () => {
      const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
      const sep = card.querySelector<HTMLElement>('.nds-separator');
      await expect(sep).toBeTruthy();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Não estoura a largura do Card', async () => {
      // O separador dentro de um container com padding é onde a largura
      // costuma vazar — medir o par prova que ele respeita a caixa.
      const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
      const sep = card.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep.getBoundingClientRect().width)
        .toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const CorCustomizada: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
        <p class="nds-text-body">Antes</p>
        <div ndsSeparator class="nds-bg-primary"></div>
        <p class="nds-text-body">Depois</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A classe extra convive com .nds-separator', async () => {
      // `class` é input do componente e entra por `cn()`: se sobrescrevesse em
      // vez de mesclar, o separador perderia o próprio visual base.
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).toHaveClass(/nds-separator/);
      await expect(sep).toHaveClass(/nds-bg-primary/);
    });
  },
};
