import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';

const meta = {
  title: 'UI/Card/Estados',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estados do Card — composição padrão, Card clicável (wrapper <a> com focus ring) e Card com footer.',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

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

    await step('Card com data-slot="card" presente', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
    });

    await step('CardTitle visível com o texto esperado', async () => {
      await expect(canvas.getByText('Cadeira Gamer Pro')).toBeVisible();
    });

    await step('data-size default aplicado', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'default');
    });
  },
};

export const Clickable: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'clickable',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wrapper <a> foi renderizado com aria-label', async () => {
      const link = canvas.getByRole('link', { name: /Abrir Cadeira Gamer Pro/ });
      await expect(link).toBeInTheDocument();
    });

    await step('Card interno permanece como data-slot="card"', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
    });

    await step('Wrapper tem classe de focus ring', async () => {
      const link = canvas.getByRole('link', { name: /Abrir Cadeira Gamer Pro/ });
      await expect(link).toHaveClass('focus-visible:ring-2');
    });
  },
};

export const WithFooter: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'withFooter',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
      actionCancel: 'Cancelar',
      actionSave: 'Salvar',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('CardFooter renderizado com border-t', async () => {
      const footer = canvasElement.querySelector('[data-slot="card-footer"]');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveClass('border-t');
    });

    await step('Botões acessíveis no footer', async () => {
      await expect(canvas.getByRole('button', { name: 'Cancelar' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Salvar' })).toBeVisible();
    });
  },
};
