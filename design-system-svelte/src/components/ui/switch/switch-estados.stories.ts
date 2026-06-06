import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';

const meta = {
  title: 'UI/Switch/Estados',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Switch: unchecked, checked, disabled, disabled-checked e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof SwitchStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-unchecked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está desativado (aria-checked=false)', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Switch tem data-unchecked', async () => {
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-checked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está ativado (aria-checked=true)', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Switch tem data-checked', async () => {
      await expect(sw).toHaveAttribute('data-state', 'checked');
    });
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-disabled',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está desabilitado', async () => {
      await expect(sw).toBeDisabled();
    });

    await step('Clicar não altera o estado', async () => {
      await userEvent.click(sw, { pointerEventsCheck: 0 });
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-disabled-checked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch desabilitado e ativado', async () => {
      await expect(sw).toBeDisabled();
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Invalid: Story = {
  args: {
    checked: false,
    ariaInvalid: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-invalid',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch tem aria-invalid true', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Switch não está desabilitado', async () => {
      await expect(sw).not.toBeDisabled();
    });
  },
};

export const Sm: Story = {
  args: {
    checked: false,
    size: 'sm',
    withLabel: true,
    labelText: 'Tamanho compacto',
    id: 'sw-sm',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch tem size sm', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
    });
  },
};
