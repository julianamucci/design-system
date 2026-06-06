import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './index';

const meta = {
  title: 'UI/Card/Tamanhos',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tamanhos do Card (prop size): "default" para uso geral e "sm" para listas densas/dashboards. O size propaga via data-size e ajusta padding (py-4 → py-3) e fonte do título (text-base → text-sm).',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
        </CardHeader>
        <CardContent class="text-base font-semibold">R$ 1.299,00</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Card tem data-size="default" (padding py-4 e título text-base)', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'default');
    });
  },
};

export const Small: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card size="sm" class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Assinantes ativos</CardTitle>
          <CardDescription>+12% no mês</CardDescription>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">8.742</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Card tem data-size="sm" (subcomponentes reagem via group-data-[size=sm])', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toHaveAttribute('data-size', 'sm');
    });

    await step('CardTitle é renderizado', async () => {
      await expect(canvas.getByText('Assinantes ativos')).toBeVisible();
    });
  },
};
