import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createFormField, createFieldset } from './form';
import { createInput } from './input';
import { createFormDocs } from '@/components/docs/FormDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type FormArgs = {
  label: string;
  placeholder: string;
  description: string;
  error: string;
  ariaInvalid: boolean;
  disabled: boolean;
};

const meta: Meta<FormArgs> = {
  title: 'UI/Form',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createFormDocs) },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do rótulo associado ao controle.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder do input — exemplo do formato esperado.',
    },
    description: {
      control: 'text',
      description: 'Texto de apoio exibido abaixo do controle.',
    },
    error: {
      control: 'text',
      description: 'Mensagem de erro (aria-live="polite"). Vazio = sem erro.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid="true" no controle.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle.',
    },
  },
  args: {
    label: 'Email',
    placeholder: 'ex: joao@empresa.com',
    description: 'Usaremos apenas para contato.',
    error: '',
    ariaInvalid: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<FormArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const input = createInput({
      type: 'email',
      placeholder: args.placeholder,
      disabled: args.disabled,
    });
    if (args.ariaInvalid || args.error) {
      input.setAttribute('aria-invalid', 'true');
    }
    return createFormField({
      label: args.label,
      input,
      description: args.description || undefined,
      error: args.error || undefined,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está presente e associado ao input', async () => {
      const input = canvas.getByLabelText(/email/i);
      await expect(input).toBeInTheDocument();
    });

    await step('Descrição é exibida abaixo do controle', async () => {
      const desc = canvasElement.querySelector('[data-slot="field-description"]');
      await expect(desc).toBeInTheDocument();
    });

    await step('Input não está desabilitado por padrão', async () => {
      const input = canvas.getByLabelText(/email/i);
      await expect(input).not.toBeDisabled();
    });
  },
};

// ─── Fieldset ─────────────────────────────────────────────────────────────────

export const Fieldset: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => {
    return createFieldset({
      legend: 'Endereço de entrega',
      children: [
        createFormField({
          label: 'Rua',
          input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }),
        }),
        createFormField({
          label: 'Cidade',
          input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }),
        }),
      ],
    });
  },
  play: async ({ canvasElement, step }) => {
    await step('Fieldset com legend está presente', async () => {
      const fs = canvasElement.querySelector('fieldset');
      const legend = canvasElement.querySelector('legend');
      await expect(fs).toBeInTheDocument();
      await expect(legend).toHaveTextContent(/endere/i);
    });
  },
};
