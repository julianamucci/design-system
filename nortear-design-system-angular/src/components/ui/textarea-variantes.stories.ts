import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsTextarea } from './textarea';
import { NdsLabel } from './label';
import {
  alturaMinimaPx,
  preencherAte,
  resizeComputado,
} from '@shared/testing/textarea-probe';

const meta: Meta = {
  title: 'UI/Textarea/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsTextarea, NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Textarea: padrão (redimensiona na vertical, altura mínima de 120px), com contador de caracteres e sem redimensionamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <label ndsLabel for="var-default">Biografia</label>
        <textarea
          ndsTextarea
          id="var-default"
          class="nds-resize-y nds-min-h-30"
          placeholder="Conte um pouco sobre você..."
        ></textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia');

    await step('Redimensiona só na vertical', async () => {
      await expect(resizeComputado(textarea)).toBe('vertical');
    });

    await step('Altura mínima de 120px', async () => {
      await expect(alturaMinimaPx(textarea)).toBe(120);
    });
  },
};

export const WithCounter: Story = {
  parameters: { covers: ['functional.item3', 'visual.item4'] },
  render: () => ({
    props: { valor: '', max: 500 },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <label ndsLabel for="var-counter">Descrição</label>
        <textarea
          ndsTextarea
          id="var-counter"
          class="nds-resize-y nds-min-h-30"
          [attr.maxlength]="max"
          placeholder="ex: Camiseta de algodão, gola redonda..."
          [value]="valor"
          (input)="valor = $any($event.target).value"
        ></textarea>
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Descreva com clareza.</span>
          <span
            aria-live="polite"
            [attr.aria-label]="valor.length + ' de ' + max + ' caracteres usados'"
          >{{ valor.length }}/{{ max }}</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea com maxlength=500', async () => {
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
  render: () => ({
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <label ndsLabel for="var-noresize">Feedback</label>
        <textarea
          ndsTextarea
          id="var-noresize"
          class="nds-resize-none nds-min-h-30"
          placeholder="O que poderíamos melhorar?"
        ></textarea>
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
