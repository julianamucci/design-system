import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsTextarea } from './textarea';
import { NdsLabel } from './label';
import { NdsButton } from './button';
import { resizeComputado } from '@shared/testing/textarea-probe';

const meta: Meta = {
  title: 'Components/Form/Textarea/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsTextarea, NdsLabel, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Textarea com Label, texto de apoio, contador acessível, mensagem de erro e envio em formulário HTML nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="comp-label">Descrição</label>
        <textarea
          ndsTextarea
          id="comp-label"
          class="nds-resize-y nds-min-h-30"
          placeholder="ex: Descreva o produto..."
        ></textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label associado ao textarea via for/id', async () => {
      await expect(canvas.getByLabelText('Descrição')).toBeInTheDocument();
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      const label = canvasElement.querySelector<HTMLLabelElement>('label[for="comp-label"]')!;
      await userEvent.click(label);
      await expect(canvas.getByLabelText('Descrição')).toHaveFocus();
    });
  },
};

export const WithSupportText: Story = {
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="comp-hint">Descrição</label>
        <textarea
          ndsTextarea
          id="comp-hint"
          class="nds-resize-y nds-min-h-30"
          aria-describedby="comp-hint-apoio"
          placeholder="ex: Descreva o produto..."
        ></textarea>
        <p id="comp-hint-apoio" class="nds-text-caption nds-text-muted-foreground">
          Descreva o produto com clareza, destacando os principais atributos.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição');

    await step('Texto de apoio visível', async () => {
      await expect(canvas.getByText(/Descreva o produto com clareza/)).toBeVisible();
    });

    await step('aria-describedby aponta para um texto que existe', async () => {
      const id = textarea.getAttribute('aria-describedby')!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
    });
  },
};

export const WithAccessibleCounter: Story = {
  render: () => ({
    props: { value: '', max: 280 },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="comp-counter">Mensagem</label>
        <textarea
          ndsTextarea
          id="comp-counter"
          class="nds-resize-y nds-min-h-30"
          [attr.maxlength]="max"
          placeholder="ex: Compartilhe seu pensamento..."
          [value]="value"
          (input)="value = $any($event.target).value"
        ></textarea>
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Limite: 280 caracteres.</span>
          <span
            aria-live="polite"
            [attr.aria-label]="value.length + ' de ' + max + ' caracteres usados'"
          >{{ value.length }}/{{ max }}</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Mensagem') as HTMLTextAreaElement;

    await step('maxlength está aplicado no campo', async () => {
      await expect(textarea).toHaveAttribute('maxlength', '280');
    });

    await step('Digitar atualiza o contador acessível', async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Olá mundo');
      const counter = canvas.getByLabelText(/9 de 280 caracteres usados/);
      await expect(counter).toHaveTextContent('9/280');
      await expect(counter).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const WithErrorMessage: Story = {
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="comp-error">Descrição</label>
        <textarea
          ndsTextarea
          id="comp-error"
          class="nds-resize-y nds-min-h-30"
          aria-invalid="true"
          aria-describedby="comp-error-msg"
          placeholder="ex: Descreva o produto..."
        ></textarea>
        <p id="comp-error-msg" class="nds-text-caption nds-text-destructive">
          A descrição é obrigatória e deve ter pelo menos 20 caracteres.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição');

    await step('Textarea com aria-invalid e mensagem vinculada', async () => {
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
      const id = textarea.getAttribute('aria-describedby')!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
      await expect(canvas.getByText(/pelo menos 20 caracteres/)).toBeVisible();
    });
  },
};

export const ModalNoResize: Story = {
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="comp-modal">Observações</label>
        <textarea
          ndsTextarea
          id="comp-modal"
          class="nds-resize-none nds-min-h-30"
          placeholder="Adicione observações relevantes..."
        ></textarea>
        <p class="nds-text-caption nds-text-muted-foreground">
          Sem redimensionamento — ideal para modais.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Redimensionamento desligado', async () => {
      await expect(resizeComputado(canvas.getByLabelText('Observações'))).toBe('none');
    });
  },
};

export const InForm: Story = {
  render: () => ({
    props: {
      enviado: '',
      enviar(evento: Event) {
        evento.preventDefault();
        const data = new FormData(evento.target as HTMLFormElement);
        this.enviado = `Enviado: feedback="${String(data.get('feedback') ?? '')}"`;
      },
    },
    template: `
      <form
        class="nds-stack nds-w-md"
        data-spacing="md"
        aria-label="Formulário de feedback"
        (submit)="enviar($event)"
      >
        <div class="nds-stack" data-spacing="sm">
          <label ndsLabel for="comp-form">Feedback</label>
          <textarea
            ndsTextarea
            id="comp-form"
            name="feedback"
            class="nds-resize-y nds-min-h-30"
            placeholder="O que poderíamos melhorar?"
          ></textarea>
        </div>
        <button ndsButton type="submit">Enviar</button>
        @if (enviado) {
          <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">{{ enviado }}</p>
        }
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Feedback') as HTMLTextAreaElement;

    await step('Textarea tem atributo name para o FormData', async () => {
      await expect(textarea.name).toBe('feedback');
    });

    await step('Submit captura o valor via FormData nativo', async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Mais exemplos');
      await userEvent.click(canvas.getByRole('button', { name: 'Enviar' }));
      await expect(canvas.getByText(/Enviado: feedback="Mais exemplos"/)).toBeVisible();
    });
  },
};
