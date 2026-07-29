import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Variantes',
  component: Alert,
  tags: ['feedback'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'destructive',
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      showIcon: true,
      icon: 'error',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      showIcon: true,
      icon: 'success',
      class: 'nds-alert-success',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(within(canvasElement).getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Assinatura expirando',
      description: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
      showIcon: true,
      icon: 'warning',
      class: 'nds-alert-warning',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(within(canvasElement).getByText('Assinatura expirando')).toBeVisible();
  },
};
