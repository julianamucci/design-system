import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Input } from './index';
import InputStory from './InputStory.svelte';

const meta = {
  title: 'UI/Input/Estados',
  component: InputStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Estados do Input: padrão, desabilitado, erro (aria-invalid) e com placeholder.',
      },
    },
  },
} satisfies Meta<typeof InputStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'text', placeholder: 'ex: João da Silva' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input padrão está presente e visível', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeVisible();
      await expect(input).not.toBeDisabled();
    });

    await step('Input possui data-slot="input"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('data-slot', 'input');
    });
  },
};

export const ComPlaceholder: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'email', placeholder: 'ex: joao@empresa.com' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Placeholder está presente no input', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('placeholder', 'ex: joao@empresa.com');
    });
  },
};

export const Desabilitado: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'text', placeholder: 'Não disponível', disabled: true },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input está desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeDisabled();
    });

    await step('Input não aceita digitação quando desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await userEvent.click(input, { pointerEventsCheck: 0 });
      await userEvent.type(input, 'teste', { pointerEventsCheck: 0 });
      await expect(input).toHaveValue('');
    });
  },
};

export const Erro: Story = {
  render: () => ({
    Component: InputStory,
    props: {
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      'aria-invalid': 'true',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input possui aria-invalid="true"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Input está visível no estado de erro', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeVisible();
    });
  },
};
