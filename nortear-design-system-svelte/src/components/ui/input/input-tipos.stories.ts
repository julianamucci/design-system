import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import InputStory from './InputStory.svelte';

const meta: Meta = {
  title: 'UI/Input/Types',
  component: InputStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Variações de tipo HTML do Input. Use sempre o tipo semântico correto para melhor UX mobile e validação nativa do browser.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Text: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'text', placeholder: 'ex: João da Silva' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de texto renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'email', placeholder: 'ex: joao@empresa.com' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de email renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Password: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'password', placeholder: '••••••••' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de senha renderizado', async () => {
      const input = canvas.getByDisplayValue('');
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};

export const Number: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'number', placeholder: '0' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input numérico renderizado', async () => {
      const input = canvas.getByRole('spinbutton');
      await expect(input).toHaveAttribute('type', 'number');
    });
  },
};

export const File: Story = {
  render: () => ({
    Component: InputStory,
    props: { type: 'file', 'aria-label': 'Selecionar arquivo' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Input de arquivo renderizado com data-slot', async () => {
      const input = canvasElement.querySelector('[data-slot="input"]') as HTMLInputElement;
      await expect(input).toBeInTheDocument();
      await expect(input).toHaveAttribute('type', 'file');
    });
  },
};
