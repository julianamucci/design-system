import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';

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
      description: 'Ícone posicionado automaticamente via CSS grid.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText(/Ícone SVG|Informação/)).toBeVisible();
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
    await expect(canvas.getByText(/Formulário incompleto/)).toBeVisible();
  },
};

export const DestructiveComIcone: Story = {
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
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const MultiplasCores: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      showIcon: true,
      icon: 'success',
      class: 'nds-alert-success',
      descriptionClass: 'text-success/90',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
  },
};
