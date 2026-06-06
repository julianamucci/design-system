import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';

const meta = {
  title: 'UI/Checkbox/Estados',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked, checked, indeterminate (Svelte only), disabled e error (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-unchecked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está desmarcado', async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step('aria-checked é false', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está marcado', async () => {
      await expect(checkbox).toBeChecked();
    });

    await step('aria-checked é true', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Indeterminate: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: true,
      labelText: 'Selecionar todos os itens',
      id: 'cb-indeterminate',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-checked mixed', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está desabilitado', async () => {
      await expect(checkbox).toBeDisabled();
    });

    await step('Clicar não altera o estado', async () => {
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox).not.toBeChecked();
    });
  },
};

export const DisabledChecked: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox desabilitado e marcado', async () => {
      await expect(checkbox).toBeDisabled();
      await expect(checkbox).toBeChecked();
    });
  },
};

export const Error: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      ariaInvalid: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-error',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-invalid true', async () => {
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Checkbox não está desabilitado', async () => {
      await expect(checkbox).not.toBeDisabled();
    });
  },
};
