import type { Meta, StoryObj } from '@storybook/svelte';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';

const meta = {
  title: 'UI/Alert/Composições',
  component: Alert,
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
};

export const SemTituloCompacto: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      title: '',
      description: 'Formulário incompleto — preencha todos os campos obrigatórios.',
      showIcon: true,
      icon: 'error',
    },
  }),
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
};

export const MultiplasCores: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      showIcon: true,
      icon: 'success',
      class: 'bg-success/10 text-success border-success/30',
      descriptionClass: 'text-success/90',
    },
  }),
};
