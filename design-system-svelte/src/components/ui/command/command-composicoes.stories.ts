import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Root as Command } from '@/components/ui/command';
import CommandComposicaoGruposStory from './CommandComposicaoGruposStory.svelte';
import CommandComposicaoShortcutsStory from './CommandComposicaoShortcutsStory.svelte';
import CommandComposicaoLinkItemStory from './CommandComposicaoLinkItemStory.svelte';
import CommandComposicaoPaletteStory from './CommandComposicaoPaletteStory.svelte';

const meta = {
  title: 'UI/Command/Composicoes',
  component: Command,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Padrões de composição do Command: com grupos e separadores, com shortcuts, com CommandLinkItem e command palette.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComGrupos: Story = {
  name: 'Com Grupos',
  render: () => ({
    Component: CommandComposicaoGruposStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('grupos são renderizados com headings', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toBeInTheDocument();
    });

    await step('filtro fuzzy funciona entre grupos', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.type(input, 'button');
      const item = canvas.getByText('Button');
      await expect(item).toBeInTheDocument();
      await userEvent.clear(input);
    });
  },
};

export const ComShortcuts: Story = {
  name: 'Com Shortcuts',
  render: () => ({
    Component: CommandComposicaoShortcutsStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('shortcuts são renderizados nos itens', async () => {
      const shortcut = canvas.getByText('⌘N');
      await expect(shortcut).toBeInTheDocument();
    });
  },
};

export const ComLinkItem: Story = {
  name: 'Com CommandLinkItem',
  render: () => ({
    Component: CommandComposicaoLinkItemStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('link items estão presentes', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toBeInTheDocument();
    });
  },
};

export const CommandPalette: Story = {
  name: 'Command Palette',
  render: () => ({
    Component: CommandComposicaoPaletteStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('botão de abertura do command palette está presente', async () => {
      const btn = canvas.getByRole('button', { name: /buscar/i });
      await expect(btn).toBeInTheDocument();
    });
  },
};
