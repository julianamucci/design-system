import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';
import { textareaSource } from './textarea.source';
import { createLabel } from './label';
import { createTextareaDocs } from '@/components/docs/TextareaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { resizeComputado } from '@shared/testing/textarea-probe';

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
  title: 'Primitives/Form/Textarea',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createTextareaDocs), source: { transform: textareaSource } },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readOnly: {
      control: 'boolean',
      description: 'Apenas leitura — selecionável mas não editável.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica estado de erro via aria-invalid.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    value: {
      control: 'text',
      description: 'Valor inicial do textarea.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    rows: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Linhas visíveis. Só aumenta a altura acima do mínimo da classe .nds-min-h-*',
      table: { type: { summary: 'number' }, defaultValue: { summary: '2' } },
    },
    maxLength: {
      control: { type: 'number', min: 0, max: 5000, step: 50 },
      description: 'Limite de caracteres (0 desabilita).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    resize: {
      control: 'inline-radio',
      options: ['y', 'none', 'free'],
      description: 'Direção de redimensionamento via classe .nds-resize-*.',
      table: { type: { summary: "'y' | 'none' | 'free'" }, defaultValue: { summary: "'y'" } },
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    disabled: false,
    readOnly: false,
    ariaInvalid: false,
    value: '',
    rows: 3,
    maxLength: 500,
    resize: 'y',
  },
};

export default meta;
type Story = StoryObj<TextareaArgs>;

const RESIZE_CLASSNAME: Record<TextareaArgs['resize'], string> = {
  none: 'nds-resize-none',
  free: 'nds-resize',
  y: 'nds-resize-y',
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'functional.item4'],
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-md';
    wrapper.dataset.spacing = 'sm';

    const id = 'playground-textarea';
    wrapper.appendChild(createLabel({ htmlFor: id, text: 'Descrição' }));

    const textarea = createTextarea({
      id,
      placeholder: args.placeholder,
      disabled: args.disabled,
      value: args.value || undefined,
      rows: args.rows > 0 ? args.rows : undefined,
      // Altura mínima vem do utilitário, não de `style` inline: inline vence a
      // folha e sairia do tema, da densidade e da escala.
      class: `${RESIZE_CLASSNAME[args.resize]} nds-min-h-30`,
    });

    if (args.readOnly) textarea.readOnly = true;
    if (args.ariaInvalid) textarea.setAttribute('aria-invalid', 'true');
    if (args.maxLength > 0) textarea.maxLength = args.maxLength;

    wrapper.appendChild(textarea);

    if (args.maxLength > 0) {
      const row = document.createElement('div');
      row.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
      row.dataset.justify = 'between';

      const hint = document.createElement('span');
      hint.textContent = 'Descreva o produto com clareza.';

      const counter = document.createElement('span');
      counter.className = 'nds-tabular-nums nds-shrink-0';
      counter.setAttribute('aria-live', 'polite');

      const update = () => {
        const n = textarea.value.length;
        counter.textContent = `${n}/${args.maxLength}`;
        counter.setAttribute('aria-label', `${n} de ${args.maxLength} caracteres usados`);
      };
      update();
      textarea.addEventListener('input', update);

      row.append(hint, counter);
      wrapper.appendChild(row);
    }

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea presente com data-slot=textarea', async () => {
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
      await expect(textarea).not.toBeDisabled();
    });

    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvasElement.querySelector('label[for="playground-textarea"]') as HTMLLabelElement;
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
    });

    await step('Digitar texto atualiza o valor e o contador', async () => {
      // Limpa antes: no replay do painel o campo chega com o texto da rodada
      // anterior, e cada passo estabelece a própria precondição.
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Camiseta de algodão');
      await expect(textarea.value).toBe('Camiseta de algodão');
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute('aria-live', 'polite');
      await expect(counter).toHaveTextContent('19/500');
    });

    await step('Enter insere quebra de linha em vez de enviar', async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Linha 1{Enter}Linha 2');
      await expect(textarea.value).toBe('Linha 1\nLinha 2');
    });

    await step('O campo redimensiona só na vertical', async () => {
      await expect(resizeComputado(textarea)).toBe('vertical');
    });
  },
};
