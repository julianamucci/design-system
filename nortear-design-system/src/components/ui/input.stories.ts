import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createInput } from './input';
import { createInputDocs } from '@/components/docs/InputDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type InputArgs = {
  type: string;
  placeholder: string;
  disabled: boolean;
  ariaInvalid: boolean;
  value: string;
};

const meta: Meta<InputArgs> = {
  title: 'UI/Input',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createInputDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'file'],
      description: 'Tipo HTML do input.',
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica estado de erro via aria-invalid.',
    },
    value: {
      control: 'text',
      description: 'Valor inicial do campo.',
    },
  },
  args: {
    type: 'text',
    placeholder: 'ex: João da Silva',
    disabled: false,
    ariaInvalid: false,
    value: '',
  },
};

export default meta;
type Story = StoryObj<InputArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const input = createInput({
      type: args.type,
      placeholder: args.placeholder,
      disabled: args.disabled,
      value: args.value || undefined,
    });
    if (args.ariaInvalid) {
      input.setAttribute('aria-invalid', 'true');
    }
    return input;
  },
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

    await step('Input não está desabilitado por padrão', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).not.toBeDisabled();
    });
  },
};
