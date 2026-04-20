import type { Meta, StoryObj } from '@storybook/svelte';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';

const meta = {
  title: 'UI/Alert/Variantes',
  component: Alert,
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
      class: 'bg-success/10 text-success border-success/30',
      descriptionClass: 'text-success/90',
    },
  }),
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
      class: 'bg-warning/10 text-warning border-warning/30',
      descriptionClass: 'text-warning/90',
    },
  }),
};
