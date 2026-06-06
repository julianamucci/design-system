import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';
import CardDocs from '@/components/docs/CardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs', 'layout'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CardDocs),
      description: {
        component:
          'Card é container estrutural que agrupa conteúdo relacionado. 2 tamanhos (default, sm) + 7 subcomponentes (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter).',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do Card — propaga via data-size para subcomponentes',
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: CardStory,
    props: {
      variant: 'withFooter',
      size: args.size,
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

    await step('Card com data-slot="card" está presente', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
    });

    await step('CardTitle e CardDescription visíveis', async () => {
      await expect(canvas.getByText('Cadeira Gamer Pro')).toBeVisible();
      await expect(canvas.getByText(/ergonômica/)).toBeVisible();
    });

    await step('CardFooter com border-t e bg-muted/50', async () => {
      const footer = canvasElement.querySelector('[data-slot="card-footer"]');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveClass('border-t');
      await expect(footer).toHaveClass('bg-muted/50');
    });

    await step('Botões do footer visíveis com nome acessível', async () => {
      await expect(canvas.getByRole('button', { name: 'Cancelar' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Salvar' })).toBeVisible();
    });

    await step('data-size reflete a prop size', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'default');
    });
  },
};
