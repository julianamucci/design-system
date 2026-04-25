import type { Meta, StoryObj } from '@storybook/svelte';
import SonnerToastStory from './SonnerToastStory.svelte';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: SonnerToastStory,
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Tipos de toast disponíveis no Sonner. Cada tipo comunica semântica distinta — use <code>richColors</code> no Toaster para ativar as cores do tema.',
      },
    },
  },
} satisfies Meta<typeof SonnerToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'default', message: 'Código copiado.' },
  }),
};

export const Success: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'success', message: 'Alterações salvas.' },
  }),
};

export const Error: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'error', message: 'Não foi possível salvar. Tente novamente.' },
  }),
};

export const Warning: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'warning', message: 'Sua sessão expira em 5 minutos.' },
  }),
};

export const Info: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'info', message: 'Nova versão disponível.' },
  }),
};

export const Loading: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'loading', message: 'Enviando arquivo...' },
  }),
};
