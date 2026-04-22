import type { Meta, StoryObj } from '@storybook/svelte';
import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';

const meta = {
  title: 'UI/Card/Composições',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composições comuns do Card: com footer, com action, com imagem e exemplos reais (produto, métrica, perfil).',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    await step('Footer renderizado', async () => {
      const footer = canvasElement.querySelector('[data-slot="card-footer"]');
      await expect(footer).toBeInTheDocument();
    });
    await step('Ações do footer visíveis', async () => {
      await expect(canvas.getByRole('button', { name: 'Cancelar' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Salvar' })).toBeVisible();
    });
  },
};

export const WithAction: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'withAction',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
      actionEdit: 'Editar',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('CardAction renderizado no header', async () => {
      const action = canvasElement.querySelector('[data-slot="card-action"]');
      await expect(action).toBeInTheDocument();
    });
    await step('Botão com aria-label contextual', async () => {
      await expect(
        canvas.getByRole('button', { name: /Editar Cadeira Gamer Pro/ })
      ).toBeVisible();
    });
  },
};

export const WithImage: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'withImage',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
    },
  }),
};

export const ProductCard: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'product',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      productStock: 'Em estoque',
      actionEdit: 'Editar',
      actionDelete: 'Excluir',
    },
  }),
};

export const MetricCard: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'metric',
      title: 'Assinantes ativos',
      metricValue: '8.742',
      metricTrend: '+12% no mês',
    },
  }),
};

export const ProfileCard: Story = {
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'profile',
      title: 'Maria Rodrigues',
      description: 'Designer de produto · São Paulo, BR',
      actionEdit: 'Editar',
    },
  }),
};
