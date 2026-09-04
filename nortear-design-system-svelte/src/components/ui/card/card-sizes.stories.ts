import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';
import { cardDefaultSource, cardPequenoSource } from './card.source';

const meta: Meta = {
  title: 'Components/Layout/Card/Sizes',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; a que muda a composição
      // sobrescreve com a sua logo abaixo.
      source: { transform: cardDefaultSource },
      description: {
        component:
          'Tamanhos do Card: "default" para uso geral e "sm" para listas densas e dashboards. O tamanho propaga via data-size e ajusta padding e tamanho do título das partes internas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Mede a mesma propriedade com o outro `data-size` e devolve o atributo ao
 * valor original. É o único jeito de comparar os dois tamanhos numa story que
 * mostra um só — e prova que a regra de CSS existe, em vez de afirmar que o
 * atributo está escrito. Restaura o estado, então sobrevive ao replay.
 */
function otherSizeMeasure(
  card: HTMLElement,
  other: 'default' | 'sm',
  ler: () => number,
): number {
  const original = card.getAttribute('data-size')!;
  card.setAttribute('data-size', other);
  const value = ler();
  card.setAttribute('data-size', original);
  return value;
}

export const Default: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'default',
      size: 'default',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('O tamanho padrão é o declarado quando ninguém escolhe', async () => {
      await expect(card).toHaveAttribute('data-size', 'default');
    });

    await step('O título continua sendo heading no tamanho padrão', async () => {
      await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
    });
  },
};

export const Small: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: { source: { transform: cardPequenoSource } },
  },
  render: () => ({
    Component: CardStory,
    props: { variant: 'small' },
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;

    await step('data-size="sm" chega ao root', async () => {
      await expect(card).toHaveAttribute('data-size', 'sm');
    });

    await step('O tamanho sm reduz o padding de verdade', async () => {
      const padSm = Number.parseFloat(getComputedStyle(card).paddingTop);
      const padDefault = otherSizeMeasure(card, 'default', () =>
        Number.parseFloat(getComputedStyle(card).paddingTop),
      );
      await expect(padSm).toBeLessThan(padDefault);
    });

    await step('O tamanho sm reduz o título de verdade', async () => {
      const fonteSm = Number.parseFloat(getComputedStyle(title).fontSize);
      const fonteDefault = otherSizeMeasure(card, 'default', () =>
        Number.parseFloat(getComputedStyle(title).fontSize),
      );
      await expect(fonteSm).toBeLessThan(fonteDefault);
    });
  },
};
