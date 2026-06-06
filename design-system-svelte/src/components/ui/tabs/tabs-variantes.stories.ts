import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';

const meta = {
  title: 'UI/Tabs/Variantes',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
  },
  args: {
    defaultValue: 'overview',
  },
} satisfies Meta<typeof TabsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
  { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.'   },
  { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
];

export const Default: Story = {
  render: (args) => ({
    Component: TabsStory,
    props: { ...args, items: ITEMS, variant: 'default', ariaLabel: 'Seções do componente' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Variante default: fundo `muted` arredondado com sombra na tab ativa. Use em painéis de configuração e abas de conteúdo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('TabsList tem data-variant=default', async () => {
      const list = canvas.getByRole('tablist');
      await waitFor(
        () => expect(list).toHaveAttribute('data-variant', 'default'),
        { timeout: 500 }
      );
    });

    await step('Clicar em tab a ativa', async () => {
      const tabs = canvas.getAllByRole('tab');
      await userEvent.click(tabs[1]);
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const Line: Story = {
  render: (args) => ({
    Component: TabsStory,
    props: { ...args, items: ITEMS, variant: 'line', ariaLabel: 'Seções do componente' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Variante line: visual minimalista com linha inferior na tab ativa. Útil para sub-navegação dentro de páginas.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Vertical: Story = {
  render: (args) => ({
    Component: TabsStory,
    props: {
      ...args,
      items: ITEMS,
      variant: 'default',
      orientation: 'vertical',
      ariaLabel: 'Seções do componente',
      class: 'w-full max-w-xl',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Orientação vertical: lista lateral à esquerda e conteúdo à direita. Setas Up/Down navegam entre tabs.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
