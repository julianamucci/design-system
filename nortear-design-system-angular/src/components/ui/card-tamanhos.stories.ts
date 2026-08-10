import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_CARD } from './card';

const meta: Meta = {
  title: 'UI/Card/Tamanhos',
  decorators: [moduleMetadata({ imports: [...NDS_CARD] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Sizes: Story = {
  parameters: { covers: ['functional.item5', 'visual.item1', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" data-min="16rem">
        <div ndsCard size="default">
          <div ndsCardHeader>
            <h3 ndsCardTitle>Default</h3>
            <p ndsCardDescription>Padding e tipografia padrão</p>
          </div>
          <div ndsCardContent>Corpo do card.</div>
        </div>

        <div ndsCard size="sm">
          <div ndsCardHeader>
            <h3 ndsCardTitle>Small</h3>
            <p ndsCardDescription>Padding e tipografia reduzidos</p>
          </div>
          <div ndsCardContent>Corpo do card.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada card declara o próprio data-size', async () => {
      const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="card"]')];
      await expect(cards).toHaveLength(2);
      await expect(cards[0]).toHaveAttribute('data-size', 'default');
      await expect(cards[1]).toHaveAttribute('data-size', 'sm');
    });

    await step('O tamanho sm reduz o padding de verdade', async () => {
      // `data-size` sozinho é atributo; o que a pessoa vê é o padding que ele
      // propaga. Sem medir, uma regra de CSS removida passaria despercebida.
      const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="card"]')];
      const pad = (el: HTMLElement) => Number.parseFloat(getComputedStyle(el).paddingTop);
      await expect(pad(cards[1])).toBeLessThan(pad(cards[0]));
    });
  },
};
