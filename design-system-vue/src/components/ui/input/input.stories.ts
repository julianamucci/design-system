import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Input } from './index';
import InputDocs from '@/components/docs/InputDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(InputDocs) },
    layout: 'centered',
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
  },
  args: {
    type: 'text',
    placeholder: 'ex: João da Silva',
    disabled: false,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Input },
    setup() { return { args }; },
    template: '<div class="w-64"><Input v-bind="args" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input está presente no DOM', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
    });

    await step('Input está visível', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeVisible();
    });

    await step('Input possui data-slot="input"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('data-slot', 'input');
    });

    await step('Digitar no input atualiza o valor', async () => {
      const input = canvas.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, 'Teste');
      await expect(input).toHaveValue('Teste');
    });
  },
};
