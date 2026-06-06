import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Textarea } from './index';
import TextareaStory from './TextareaStory.svelte';
import TextareaDocs from '@/components/docs/TextareaDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(TextareaDocs) },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea',
    },
    readonly: {
      control: 'boolean',
      description: 'Modo somente leitura',
    },
    'aria-invalid': {
      control: 'select',
      options: [undefined, 'true', 'false'],
      description: 'Estado de erro de validação',
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    disabled: false,
    readonly: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: TextareaStory,
    props: {
      ...args,
      id: 'pg-textarea',
      labelText: 'Descrição',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea é renderizado no DOM', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeInTheDocument();
    });

    await step('Textarea possui data-slot="textarea"', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });

    await step('Textarea aceita digitação de texto', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Linha 1\nLinha 2');
      await expect(textarea.value).toContain('Linha 1');
    });

    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvasElement.querySelector('label[for="pg-textarea"]') as HTMLLabelElement;
      await userEvent.click(label);
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveFocus();
    });
  },
};
