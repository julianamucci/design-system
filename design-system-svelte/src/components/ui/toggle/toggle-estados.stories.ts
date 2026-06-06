import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import ToggleStory from './ToggleStory.svelte';

const meta = {
  title: 'UI/Toggle/Estados',
  component: ToggleStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Toggle: off, on, disabled, disabled-pressed e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof ToggleStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: {
    pressed: false,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle não pressionado (aria-pressed=false)', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await step('data-state=off', async () => {
      await expect(toggle).toHaveAttribute('data-state', 'off');
    });
  },
};

export const On: Story = {
  args: {
    pressed: true,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle pressionado (aria-pressed=true)', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await step('data-state=on', async () => {
      await expect(toggle).toHaveAttribute('data-state', 'on');
    });
  },
};

export const Disabled: Story = {
  args: {
    pressed: false,
    disabled: true,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle está desabilitado', async () => {
      await expect(toggle).toBeDisabled();
    });

    await step('Clicar não altera estado', async () => {
      await userEvent.click(toggle, { pointerEventsCheck: 0 });
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const DisabledPressed: Story = {
  args: {
    pressed: true,
    disabled: true,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle desabilitado e pressionado', async () => {
      await expect(toggle).toBeDisabled();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

export const Invalid: Story = {
  args: {
    pressed: false,
    ariaInvalid: true,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle tem aria-invalid=true', async () => {
      await expect(toggle).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Toggle não está desabilitado', async () => {
      await expect(toggle).not.toBeDisabled();
    });
  },
};

export const Sm: Story = {
  args: {
    pressed: false,
    size: 'sm',
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle presente', async () => {
      await expect(toggle).toBeInTheDocument();
    });
  },
};

export const Lg: Story = {
  args: {
    pressed: false,
    size: 'lg',
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle presente', async () => {
      await expect(toggle).toBeInTheDocument();
    });
  },
};
