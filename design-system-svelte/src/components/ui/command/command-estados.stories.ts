import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import * as Command from '@/components/ui/command';
import CommandEstadoEmptyStory from './CommandEstadoEmptyStory.svelte';
import CommandEstadoLoadingStory from './CommandEstadoLoadingStory.svelte';
import CommandEstadoDisabledStory from './CommandEstadoDisabledStory.svelte';

const meta = {
  title: 'UI/Command/Estados',
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
} satisfies Meta<typeof Command.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EstadoVazio: Story = {
  name: 'Empty State',
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

export const EstadoCarregando: Story = {
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
  name: 'Item Desabilitado',
  render: () => ({
    Component: CommandEstadoDisabledStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('item desabilitado está presente', async () => {
      const items = canvas.getAllByRole('option');
      const disabled = items.find((el) => el.getAttribute('data-disabled') === 'true');
      await expect(disabled).toBeDefined();
    });
  },
};
