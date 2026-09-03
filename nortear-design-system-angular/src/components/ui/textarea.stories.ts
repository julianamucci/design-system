import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsTextarea } from './textarea';
import { NdsLabel } from './label';
import { NdsTextareaDocs } from '@/components/docs/TextareaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { resizeComputado } from '@shared/testing/textarea-probe';
import { textareaPlaygroundSource, type TextareaArgs } from './textarea.source';

const meta: Meta<TextareaArgs> = {
  title: 'Primitives/Form/Textarea',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsTextarea, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsTextareaDocs) },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do rótulo associado.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo. Nunca substitui o rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Apenas leitura — selecionável mas não editável.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Marca o campo como inválido via aria-invalid.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rows: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Linhas visíveis. Só aumenta a altura acima do mínimo da classe .nds-min-h-*',
      table: { type: { summary: 'number' }, defaultValue: { summary: '2' } },
    },
    maxlength: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Limite de caracteres.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    label: 'Descrição',
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    disabled: false,
    readonly: false,
    invalid: false,
    rows: 3,
    maxlength: 500,
  },
};

export default meta;
type Story = StoryObj<TextareaArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: textareaPlaygroundSource } },
    covers: ['functional.item1', 'functional.item2', 'functional.item4'],
  },
  render: (args) => ({
    props: { ...args, value: '' },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="pg-textarea">{{ label }}</label>
        <textarea
          ndsTextarea
          id="pg-textarea"
          class="nds-resize-y nds-min-h-30"
          [rows]="rows"
          [attr.maxlength]="maxlength"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readOnly]="readonly"
          [attr.aria-invalid]="invalid ? 'true' : null"
          [value]="value"
          (input)="value = $any($event.target).value"
        ></textarea>
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Descreva o produto com clareza.</span>
          <span
            aria-live="polite"
            [attr.aria-label]="value.length + ' de ' + maxlength + ' caracteres usados'"
          >{{ value.length }}/{{ maxlength }}</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const textarea = canvasElement.querySelector<HTMLTextAreaElement>('[data-slot="textarea"]')!;

    await step('É um <textarea> nativo com a classe do design system', async () => {
      await expect(textarea.tagName).toBe('TEXTAREA');
      await expect(textarea).toHaveClass(/nds-textarea/);
    });

    await step('O rótulo está associado ao campo', async () => {
      // Buscar por name é o que prova a associação: `for` apontando para id
      // inexistente passaria numa checagem de atributo.
      await expect(canvas.getByLabelText(args.label)).toBe(textarea);
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      const label = canvasElement.querySelector<HTMLLabelElement>('label[for="pg-textarea"]')!;
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
