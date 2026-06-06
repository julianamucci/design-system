import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CommandDocs from '@/components/docs/CommandDocs.svelte';
import { Root as Command } from '@/components/ui/command';
import CommandStory from './CommandStory.svelte';

const meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      description: {
        component:
          'Interface de busca e seleção rápida com filtro fuzzy integrado. Suporta uso inline, combobox e command palette.',
      },
    },
  },
  argTypes: {
    loop: {
      control: 'boolean',
      description: 'Navegação por teclado cicla do último para o primeiro item',
    },
    shouldFilter: {
      control: 'boolean',
      description: 'Habilita filtro interno por texto (desative para filtro externo)',
    },
  },
  args: {
    loop: false,
    shouldFilter: true,
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: CommandStory,
    props: {
      ...args,
      placeholder: 'Buscar componente...',
      emptyMessage: 'Nenhum resultado encontrado.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    await step('campo de busca está presente e focável', async () => {
      await expect(input).toBeInTheDocument();
    });

    await step('filtro fuzzy oculta itens sem correspondência', async () => {
      await userEvent.type(input, 'xyzxyz');
      const emptyEl = canvas.queryByText('Nenhum resultado encontrado.');
      await expect(emptyEl).toBeInTheDocument();
    });

    await step('limpar busca restaura itens', async () => {
      await userEvent.clear(input);
      const item = canvas.getByText('Button');
      await expect(item).toBeInTheDocument();
    });
  },
};
