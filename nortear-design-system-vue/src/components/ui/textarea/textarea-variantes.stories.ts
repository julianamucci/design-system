import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';
import {
  alturaMinimaPx,
  preencherAte,
  resizeComputado,
} from '@shared/testing/textarea-probe';
import {
  textareaComContadorSource,
  textareaPadraoSource,
  textareaSemRedimensionarSource,
} from './textarea.source';

const meta = {
  title: 'UI/Textarea/Variants',
  component: Textarea,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: textareaPadraoSource },
      description: {
        component:
          'O Textarea expõe 3 variantes via classes .nds-*: padrão (redimensiona na vertical), com contador de caracteres e sem redimensionamento.',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <Label for="var-default">Biografia</Label>
        <Textarea
          id="var-default"
          placeholder="Conte um pouco sobre você..."
          class="nds-resize-y nds-min-h-30"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia');

    await step('Redimensiona só na vertical', async () => {
      // Efeito computado, não nome de classe: `resize-y` sem prefixo é inerte
      // e a asserção antiga passava sem nada estar aplicado.
      await expect(resizeComputado(textarea)).toBe('vertical');
    });

    await step('Altura mínima de 120px', async () => {
      await expect(alturaMinimaPx(textarea)).toBe(120);
    });
  },
};

export const WithCounter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: {
      // O contador traz estado, limite e um bloco de texto abaixo do campo: é
      // uma composição inteira, não uma prop a mais na padrão.
      source: { transform: textareaComContadorSource },
    },
  },
  render: () => ({
    components: { Textarea, Label },
    data() {
      return { value: '', max: 500 };
    },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <Label for="var-counter">Descrição</Label>
        <Textarea
          id="var-counter"
          v-model="value"
          :maxlength="max"
          placeholder="ex: Camiseta de algodão, gola redonda..."
          class="nds-resize-y nds-min-h-30"
        />
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Descreva com clareza.</span>
          <span
            aria-live="polite"
            :aria-label="\`\${String(value).length} de \${max} caracteres usados\`"
          >
            {{ String(value).length }}/{{ max }}
          </span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea com maxlength está configurado', async () => {
      await expect(textarea).toHaveAttribute('maxlength', '500');
    });

    await step('Contador possui aria-live="polite"', async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    await step('Atingir o limite bloqueia novos caracteres', async () => {
      // Chega à borda por escrita programática (maxLength não se aplica a ela)
      // e digita os últimos de verdade — é aí que o bloqueio acontece.
      preencherAte(textarea, 496);
      await userEvent.type(textarea, 'abcdefgh');
      await expect(textarea.value.length).toBe(500);
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveTextContent('500/500');
    });
  },
};

export const NoResize: Story = {
  parameters: {
    docs: {
      // A ausência da alça É o assunto, e ela mora numa classe que a padrão não
      // tem — sem o override o snippet mostraria justamente o contrário.
      source: { transform: textareaSemRedimensionarSource },
    },
  },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <Label for="var-noresize">Feedback</Label>
        <Textarea
          id="var-noresize"
          placeholder="O que poderíamos melhorar?"
          class="nds-resize-none nds-min-h-30"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Feedback');

    await step('Redimensionamento desligado', async () => {
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};
