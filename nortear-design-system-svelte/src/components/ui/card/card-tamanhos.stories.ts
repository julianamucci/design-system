import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';

const meta: Meta = {
  title: 'UI/Card/Sizes',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card possui prop `size="default" | "sm"` que propaga via `data-size` para subcomponentes (padding, fonte).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'default',
      size: 'default',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Card com data-size="default"', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'default');
    });
    await step('CardTitle visível', async () => {
      await expect(canvas.getByText('Cadeira Gamer Pro')).toBeVisible();
    });
  },
};

export const Small: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'small',
      size: 'sm',
      title: 'Assinantes ativos',
      description: '+12% no mês',
      metricValue: '8.742',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Card com data-size="sm"', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'sm');
    });
    await step('Valor da métrica visível', async () => {
      await expect(canvas.getByText('8.742')).toBeVisible();
    });
  },
};
