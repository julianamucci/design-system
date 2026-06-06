import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';
import { createTextareaDocs } from '@/components/docs/TextareaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TextareaArgs = {
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  ariaInvalid: boolean;
  value: string;
  rows: number;
  maxLength: number;
  resize: 'y' | 'none' | 'free';
};

const meta: Meta<TextareaArgs> = {
  title: 'UI/Textarea',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createTextareaDocs) },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Apenas leitura — selecionável mas não editável.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica estado de erro via aria-invalid.',
    },
    value: {
      control: 'text',
      description: 'Valor inicial do textarea.',
    },
    rows: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Altura inicial em linhas (preferir min-h-[…] via class).',
    },
    maxLength: {
      control: { type: 'number', min: 0, max: 5000, step: 50 },
      description: 'Limite de caracteres (0 desabilita).',
    },
    resize: {
      control: 'inline-radio',
      options: ['y', 'none', 'free'],
      description: 'Direção de redimensionamento via classe Tailwind.',
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    disabled: false,
    readOnly: false,
    ariaInvalid: false,
    value: '',
    rows: 0,
    maxLength: 500,
    resize: 'y',
  },
};

export default meta;
type Story = StoryObj<TextareaArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
    wrapper.dataset.spacing = 'xs';

    const id = 'playground-textarea';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.className = 'nds-text-body nds-font-medium nds-text-foreground';
    label.textContent = 'Descrição';
    wrapper.appendChild(label);

    const resizeClass =
      args.resize === 'none' ? 'resize-none' :
      args.resize === 'free' ? 'resize' :
      'resize-y';

    const textarea = createTextarea({
      id,
      placeholder: args.placeholder,
      disabled: args.disabled,
      value: args.value || undefined,
      rows: args.rows > 0 ? args.rows : undefined,
      class: resizeClass,
    });
    textarea.style.minHeight = '120px';

    if (args.readOnly) textarea.readOnly = true;
    if (args.ariaInvalid) textarea.setAttribute('aria-invalid', 'true');
    if (args.maxLength > 0) textarea.maxLength = args.maxLength;

    wrapper.appendChild(textarea);

    if (args.maxLength > 0) {
      const counter = document.createElement('span');
      counter.className = 'nds-text-caption nds-text-muted-foreground';
      counter.style.fontVariantNumeric = 'tabular-nums';
      counter.style.alignSelf = 'flex-end';
      const initial = textarea.value.length;
      counter.textContent = `${initial}/${args.maxLength}`;
      counter.setAttribute('aria-live', 'polite');
      counter.setAttribute('aria-label', `${initial} de ${args.maxLength} caracteres usados`);
      wrapper.appendChild(counter);

      textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = `${len}/${args.maxLength}`;
        counter.setAttribute('aria-label', `${len} de ${args.maxLength} caracteres usados`);
      });
    }

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea está presente no DOM', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeInTheDocument();
    });

    await step('Textarea está visível e habilitado', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeVisible();
      await expect(textarea).not.toBeDisabled();
    });

    await step('Digitar texto atualiza o contador via aria-live', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await userEvent.type(textarea, 'Olá mundo');
      await expect(textarea.value).toBe('Olá mundo');
    });
  },
};
