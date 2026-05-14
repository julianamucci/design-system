import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';
import { createButton } from './button';

const meta: Meta = {
  title: 'UI/Textarea/Composições',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições do Textarea com Label externo, texto de apoio, contador acessível, mensagem de erro e envio em formulário HTML nativo. ' +
          'NOTA: o factory Basecoat não expõe props onChange/maxLength/readOnly/aria-invalid — todos são aplicados via API DOM nativa após a criação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createTextareaField(opts: {
  labelText: string;
  labelFor: string;
  textareaEl: HTMLTextAreaElement;
  hintText?: string;
  errorText?: string;
  maxLength?: number;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-1.5 w-full max-w-md';

  const label = document.createElement('label');
  label.htmlFor = opts.labelFor;
  label.className = 'text-sm font-medium text-foreground';
  label.textContent = opts.labelText;

  opts.textareaEl.id = opts.labelFor;

  wrapper.appendChild(label);
  wrapper.appendChild(opts.textareaEl);

  const hasHint = !!opts.hintText;
  const hasCounter = opts.maxLength !== undefined;

  if (hasHint || hasCounter) {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-start gap-3 text-xs text-muted-foreground';

    const hintSpan = document.createElement('span');
    if (hasHint) hintSpan.textContent = opts.hintText!;
    row.appendChild(hintSpan);

    if (hasCounter) {
      opts.textareaEl.maxLength = opts.maxLength!;
      const counter = document.createElement('span');
      const max = opts.maxLength!;
      counter.setAttribute('aria-live', 'polite');
      counter.setAttribute('aria-label', `0 de ${max} caracteres usados`);
      counter.className = 'tabular-nums shrink-0';
      counter.textContent = `0/${max}`;
      opts.textareaEl.addEventListener('input', () => {
        const len = opts.textareaEl.value.length;
        counter.textContent = `${len}/${max}`;
        counter.setAttribute('aria-label', `${len} de ${max} caracteres usados`);
      });
      row.appendChild(counter);
    }

    wrapper.appendChild(row);
  }

  if (opts.errorText) {
    const error = document.createElement('p');
    error.className = 'text-xs text-destructive';
    error.id = `${opts.labelFor}-error`;
    error.textContent = opts.errorText;
    opts.textareaEl.setAttribute('aria-describedby', `${opts.labelFor}-error`);
    wrapper.appendChild(error);
  }

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  render: () => {
    const textarea = createTextarea({
      placeholder: 'ex: Descreva o produto...',
      class: 'resize-y min-h-[120px]',
    });
    return createTextareaField({
      labelText: 'Descrição',
      labelFor: 'comp-label',
      textareaEl: textarea,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label associado ao textarea via htmlFor', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).toBeInTheDocument();
    });
  },
};

export const ComTextoDeApoio: Story = {
  render: () => {
    const textarea = createTextarea({
      placeholder: 'ex: Descreva o produto...',
      class: 'resize-y min-h-[120px]',
    });
    return createTextareaField({
      labelText: 'Descrição',
      labelFor: 'comp-hint',
      textareaEl: textarea,
      hintText: 'Descreva o produto com clareza, destacando os principais atributos.',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label e texto de apoio visíveis', async () => {
      await expect(canvas.getByLabelText('Descrição')).toBeInTheDocument();
      await expect(canvas.getByText(/Descreva o produto com clareza/)).toBeVisible();
    });
  },
};

export const ComContadorAcessivel: Story = {
  render: () => {
    const textarea = createTextarea({
      placeholder: 'ex: Descreva o produto em até 500 caracteres...',
      class: 'resize-y min-h-[120px]',
    });
    return createTextareaField({
      labelText: 'Descrição',
      labelFor: 'comp-counter',
      textareaEl: textarea,
      hintText: 'Descreva o produto com clareza.',
      maxLength: 500,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Contador inicial "0/500" presente com aria-live', async () => {
      const counter = canvas.getByText('0/500');
      await expect(counter).toHaveAttribute('aria-live', 'polite');
      await expect(counter).toHaveAttribute('aria-label', '0 de 500 caracteres usados');
    });
    await step('Digitar atualiza contador e aria-label', async () => {
      const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await userEvent.type(ta, 'Camiseta de algodão');
      const counter = canvas.getByText('19/500');
      await expect(counter).toHaveAttribute('aria-label', '19 de 500 caracteres usados');
    });
  },
};

export const ComMensagemDeErro: Story = {
  render: () => {
    const textarea = createTextarea({
      placeholder: 'ex: Descreva o produto...',
      class: 'resize-y min-h-[120px]',
    });
    textarea.setAttribute('aria-invalid', 'true');
    return createTextareaField({
      labelText: 'Descrição',
      labelFor: 'comp-error',
      textareaEl: textarea,
      errorText: 'A descrição é obrigatória e deve ter pelo menos 20 caracteres.',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea com aria-invalid e mensagem de erro vinculada', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).toHaveAttribute('aria-invalid', 'true');
      await expect(ta).toHaveAttribute('aria-describedby', 'comp-error-error');
      await expect(canvas.getByText(/descrição é obrigatória/)).toBeVisible();
    });
  },
};

export const EmFormulario: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'flex flex-col gap-4 w-full max-w-md';
    form.setAttribute('aria-label', 'Formulário de feedback');

    const textarea = createTextarea({
      name: 'feedback',
      placeholder: 'O que poderíamos melhorar?',
      class: 'resize-y min-h-[120px]',
    });

    const field = createTextareaField({
      labelText: 'Feedback',
      labelFor: 'comp-form-feedback',
      textareaEl: textarea,
      hintText: 'Sua opinião nos ajuda a evoluir.',
      maxLength: 280,
    });

    const submitBtn = createButton({
      label: 'Enviar',
      type: 'submit',
      variant: 'default',
    });

    const result = document.createElement('p');
    result.className = 'text-xs text-muted-foreground';
    result.setAttribute('aria-live', 'polite');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      result.textContent = `Enviado: feedback="${String(data.get('feedback') ?? '')}"`;
    });

    form.append(field, submitBtn, result);
    return form;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea tem atributo name para FormData', async () => {
      const ta = canvas.getByLabelText('Feedback') as HTMLTextAreaElement;
      await expect(ta.name).toBe('feedback');
    });
    await step('Submit captura o valor via FormData nativo', async () => {
      const ta = canvas.getByLabelText('Feedback') as HTMLTextAreaElement;
      await userEvent.type(ta, 'Mais exemplos');
      const submit = canvas.getByRole('button', { name: 'Enviar' });
      await userEvent.click(submit);
      await expect(canvas.getByText(/Enviado: feedback="Mais exemplos"/)).toBeVisible();
    });
  },
};
