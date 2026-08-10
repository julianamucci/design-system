import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import * as Command from '@/components/ui/command';
import CommandEstadoEmptyStory from './CommandEstadoEmptyStory.svelte';
import CommandEstadoLoadingStory from './CommandEstadoLoadingStory.svelte';
import CommandEstadoDisabledStory from './CommandEstadoDisabledStory.svelte';

const meta: Meta = {
  title: 'UI/Command/States',
  component: Command.Root,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Command: sem resultados (CommandEmpty), carregando (CommandLoading) e item desabilitado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const EmptyState: Story = {
  render: () => ({
    Component: CommandEstadoEmptyStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    await step('digitar texto sem correspondência exibe CommandEmpty', async () => {
      await userEvent.type(input, 'zzzzz');
      const empty = canvas.getByText('Nenhum resultado encontrado.');
      await expect(empty).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  name: 'Loading (CommandLoading)',
  render: () => ({
    Component: CommandEstadoLoadingStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('indicador de carregamento está visível', async () => {
      const loading = canvas.getByRole('progressbar');
      await expect(loading).toBeInTheDocument();
    });
  },
};

export const ItemDesabilitado: Story = {
  render: () => ({
    Component: CommandEstadoDisabledStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('item desabilitado está presente', async () => {
      const items = canvas.getAllByRole('option');
      // O bits-ui marca item desabilitado com aria-disabled — e por ele que a
      // propria lib filtra os itens navegaveis. `data-disabled` nao existe.
      const disabled = items.find((el) => el.getAttribute('aria-disabled') === 'true');
      await expect(disabled).toBeDefined();
    });
  },
};
