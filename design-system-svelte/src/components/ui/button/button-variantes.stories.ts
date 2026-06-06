import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Variantes',
  component: Button,
  tags: ['form'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'default', label: 'Salvar' } }),
  parameters: { docs: { description: { story: 'Variante primária. Use para a ação principal de uma seção.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Destructive: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'destructive', label: 'Excluir conta' } }),
  parameters: { docs: { description: { story: 'Variante destrutiva. Use para ações irreversíveis como excluir ou remover.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Outline: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'outline', label: 'Cancelar' } }),
  parameters: { docs: { description: { story: 'Variante secundária com borda. Use ao lado da ação primária em pares de ações.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Secondary: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'secondary', label: 'Ver detalhes' } }),
  parameters: { docs: { description: { story: 'Variante secundária sólida. Use para ações complementares de menor ênfase.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Ghost: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'ghost', label: 'Fechar' } }),
  parameters: { docs: { description: { story: 'Variante sem borda ou fundo. Use em toolbars e menus para reduzir ruído visual.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Link: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'link', label: 'Saiba mais' } }),
  parameters: { docs: { description: { story: 'Variante com aparência de link. Use quando a ação for navegacional em contexto textual.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
