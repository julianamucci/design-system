import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';

const meta = {
  title: 'UI/ToggleGroup/Estados',
  component: ToggleGroupStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do ToggleGroup: default, selected (aria-pressed=true), disabled (no grupo) e disabled item individual.',
      },
    },
  },
} satisfies Meta<typeof ToggleGroupStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Nenhum item selecionado (aria-checked=false)', async () => {
      for (const it of items) await expect(it).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Selected: Story = {
  args: {
    type: 'single',
    value: 'center',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Item "center" começa selecionado', async () => {
      await expect(items[1]).toHaveAttribute('aria-checked', 'true');
      await expect(items[1]).toHaveAttribute('data-state', 'on');
    });

    await step('Demais items não selecionados', async () => {
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
      await expect(items[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const MultipleSelected: Story = {
  args: {
    type: 'multiple',
    value: ['bold', 'italic'],
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');

    await step('Bold e Italic começam pressionados', async () => {
      await expect(items[0]).toHaveAttribute('aria-pressed', 'true');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Underline não pressionado', async () => {
      await expect(items[2]).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const Disabled: Story = {
  args: {
    type: 'single',
    disabled: true,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Todos os items estão desabilitados', async () => {
      for (const it of items) await expect(it).toBeDisabled();
    });

    await step('Clicar não altera estado', async () => {
      await userEvent.click(items[0], { pointerEventsCheck: 0 });
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const DisabledItem: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
    items: [
      { value: 'left', ariaLabel: 'Alinhar à esquerda', icon: 'alignLeft' },
      { value: 'center', ariaLabel: 'Centralizar', icon: 'alignCenter', disabled: true },
      { value: 'right', ariaLabel: 'Alinhar à direita', icon: 'alignRight' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Apenas o item "center" está desabilitado', async () => {
      await expect(items[0]).not.toBeDisabled();
      await expect(items[1]).toBeDisabled();
      await expect(items[2]).not.toBeDisabled();
    });
  },
};

export const Sm: Story = {
  args: {
    type: 'single',
    size: 'sm',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-size=sm', async () => {
      await expect(group).toHaveAttribute('data-size', 'sm');
    });
  },
};

export const Lg: Story = {
  args: {
    type: 'single',
    size: 'lg',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-size=lg', async () => {
      await expect(group).toHaveAttribute('data-size', 'lg');
    });
  },
};
