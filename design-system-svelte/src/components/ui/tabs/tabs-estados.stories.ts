import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';

const meta = {
  title: 'UI/Tabs/Estados',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
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
  render: () => ({
    Component: TabsStory,
    props: { items: ITEMS, defaultValue: 'properties', ariaLabel: 'Seções do componente' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado default: tabs inativas têm texto `foreground/60` sem fundo. A tab ativa tem `data-active` com fundo e sombra.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab inativa tem aria-selected=false', async () => {
      const tabs = canvas.getAllByRole('tab');
      await waitFor(
        () => expect(tabs[0]).toHaveAttribute('aria-selected', 'false'),
        { timeout: 500 }
      );
    });
  },
};

export const Active: Story = {
  render: () => ({
    Component: TabsStory,
    props: { items: ITEMS, defaultValue: 'overview', ariaLabel: 'Seções do componente' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado active: `data-active` com `bg-background`, `text-foreground` e sombra suave (variant default).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Primeira tab tem aria-selected=true', async () => {
      const tabs = canvas.getAllByRole('tab');
      await waitFor(
        () => expect(tabs[0]).toHaveAttribute('aria-selected', 'true'),
        { timeout: 500 }
      );
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
        { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.', disabled: true },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
      ],
      defaultValue: 'overview',
      ariaLabel: 'Seções do componente',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado disabled: tab não pode ser ativada. `opacity-50` e `pointer-events-none`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Segunda tab está desabilitada', async () => {
      const tabs = canvas.getAllByRole('tab');
      await expect(tabs[1]).toHaveAttribute('data-disabled');
    });

    await step('Clicar em tab disabled não a ativa', async () => {
      const tabs = canvas.getAllByRole('tab');
      await userEvent.click(tabs[1], { pointerEventsCheck: 0 });
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    Component: TabsStory,
    props: { items: ITEMS, defaultValue: 'overview', ariaLabel: 'Seções do componente' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Navegação por teclado. Tab move para a tab ativa; setas movem entre tabs. Anel de foco `ring-[3px] ring-ring/50` visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab ativa recebe foco via Tab', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[0].focus();
      await expect(tabs[0]).toHaveFocus();
    });

    await step('Home vai para primeira tab', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[2].focus();
      await userEvent.keyboard('{End}');
      await expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{Home}');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
  },
};
