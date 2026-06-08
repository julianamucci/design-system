import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';
import ButtonPairStory from './ButtonPairStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Composicoes',
  component: Button,
  tags: ['form'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeAEsquerda: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'default', label: 'Adicionar item', iconStart: 'plus' },
  }),
  parameters: { docs: { description: { story: 'Ícone à esquerda do label. O SVG deve ter aria-hidden="true" para não poluir leitores de tela.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ComIconeADireita: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'outline', label: 'Próximo', iconEnd: 'chevron-right' },
  }),
  parameters: { docs: { description: { story: 'Ícone à direita do label. Use em botões de navegação progressiva.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const IconeDestrutivo: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'destructive', label: 'Excluir', iconStart: 'trash' },
  }),
  parameters: { docs: { description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const IconOnly: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { size: 'icon', iconOnly: 'download', ariaLabel: 'Baixar arquivo' },
  }),
  parameters: { docs: { description: { story: 'Botão apenas com ícone. aria-label é obrigatório para acessibilidade.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão é acessível por aria-label', async () => {
      const button = canvas.getByRole('button', { name: 'Baixar arquivo' });
      await expect(button).toBeInTheDocument();
    });
  },
};

export const ParDeAcoes: Story = {
  render: () => ({
    Component: ButtonPairStory,
    props: { primaryLabel: 'Confirmar', secondaryLabel: 'Cancelar' },
  }),
  parameters: { docs: { description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' } } },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const AsLink: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'link', label: 'Ver documentação', href: '#docs' },
  }),
  parameters: { docs: { description: { story: 'Button renderizado como <a> via prop href — equivalente ao asChild do React. Preserva semântica de link.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });
  },
};
