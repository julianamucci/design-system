import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertAcaoStory from './AlertAcaoStory.svelte';
import AlertTiposStory from './AlertTiposStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Composicoes',
  component: Alert,
  tags: ['feedback'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIcone: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Informação',
      description: 'Ícone SVG posicionado automaticamente.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Informação')).toBeVisible();
  },
};

export const SemTituloCompacto: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'destructive',
      title: '',
      description: 'Formulário incompleto — preencha todos os campos obrigatórios.',
      showIcon: true,
      icon: 'error',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
    await expect(canvas.getByText(/Formulário incompleto/)).toBeVisible();
  },
};

export const ComAcao: Story = {
  render: () => ({ Component: AlertAcaoStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });
  },
};

export const MultiplosTipos: Story = {
  render: () => ({ Component: AlertTiposStory }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findAllByRole('alert');
    const alerts = canvas.getAllByRole('alert');
    await expect(alerts).toHaveLength(4);
    await expect(alerts[1]).toHaveClass('nds-alert-destructive');
    await expect(alerts[2]).toHaveClass('nds-alert-success');
    await expect(alerts[3]).toHaveClass('nds-alert-warning');
  },
};

export const SemIcone: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Sem ícone',
      description: 'Alert sem ícone mantém layout de coluna única.',
      showIcon: false,
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};
