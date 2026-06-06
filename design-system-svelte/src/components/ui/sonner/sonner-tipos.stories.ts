import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import SonnerToastStory from './SonnerToastStory.svelte';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: SonnerToastStory,
  tags: ['feedback'],
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

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Success: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'success', message: 'Alterações salvas.' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Error: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'error', message: 'Não foi possível salvar. Tente novamente.' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Warning: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'warning', message: 'Sua sessão expira em 5 minutos.' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Info: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'info', message: 'Nova versão disponível.' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Loading: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: { type: 'loading', message: 'Enviando arquivo...' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
