import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Input } from './index';
import InputStory from './InputStory.svelte';
import InputDocs from '@/components/docs/InputDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(InputDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'file'],
      description: 'Tipo HTML do input',
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo',
    },
    'aria-invalid': {
      control: 'select',
      options: [undefined, 'true', 'false'],
      description: 'Estado de erro',
    },
  },
  args: {
    type: 'text',
    placeholder: 'ex: João da Silva',
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: InputStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input é renderizado no DOM', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
    });

    await step('Input possui data-slot="input"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('data-slot', 'input');
    });

    await step('Input aceita entrada de texto', async () => {
      const input = canvas.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, 'Teste');
      await expect(input).toHaveValue('Teste');
    });
  },
};
