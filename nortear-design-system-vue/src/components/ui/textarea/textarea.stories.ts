import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';
import TextareaDocs from '@/components/docs/TextareaDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { resizeComputado } from '@shared/testing/textarea-probe';
import { textareaSource } from './textarea.source';

const meta = {
  title: 'Components/Form/Textarea',
  component: Textarea,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(TextareaDocs), source: { transform: textareaSource } },
    layout: 'centered',
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do conteúdo esperado',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Torna o textarea somente leitura',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maxlength: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Limite de caracteres',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    rows: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Linhas visíveis. Só aumenta a altura acima do mínimo da classe .nds-min-h-*',
      table: { type: { summary: 'number' }, defaultValue: { summary: '2' } },
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto...',
    disabled: false,
    readonly: false,
    maxlength: 500,
    rows: 3,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'functional.item4'],
  },
  render: (args) => ({
    components: { Textarea, Label },
    setup() {
      return { args };
    },
    data() {
      return { value: '' };
    },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <Label for="playground-textarea">Descrição</Label>
        <Textarea
          id="playground-textarea"
          v-model="value"
          v-bind="args"
          class="nds-resize-y nds-min-h-30"
        />
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Descreva o produto com clareza.</span>
          <span
            aria-live="polite"
            :aria-label="\`\${String(value).length} de \${args.maxlength} caracteres usados\`"
          >
            {{ String(value).length }}/{{ args.maxlength }}
          </span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui data-slot="textarea"', async () => {
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });

    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvas.getByText('Descrição');
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
