import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';

const meta = {
  title: 'UI/Select/Estados',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Select: default, open, selected, disabled e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger fechado com placeholder visível', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.getByText('Selecione...')).toBeInTheDocument();
    });
  },
};

export const Open: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown aberto via clique — `aria-expanded="true"`, listbox renderizado em portal.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Clicar abre o listbox', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      await waitForPortal('listbox');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Selected: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      value: 'sp',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger exibe label do item selecionado', async () => {
      await expect(canvas.getByText('São Paulo')).toBeInTheDocument();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      disabled: true,
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    await step('Trigger está desabilitado', async () => {
      await expect(trigger).toBeDisabled();
    });
    await step('Clicar não abre o dropdown', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await waitFor(async () => {
        await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      ariaInvalid: true,
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Trigger com `aria-invalid="true"` — borda destrutiva e anel destrutivo de 20% opacidade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger marcado como aria-invalid', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
