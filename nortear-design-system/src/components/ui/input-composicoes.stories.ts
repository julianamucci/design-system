import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createInput } from './input';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Input com label externo, texto de apoio e estado de erro com mensagem. ' +
          'O InputGroup (para prefixo/sufixo) é disponível apenas na stack React.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createFormField(opts: {
  labelText: string;
  labelFor: string;
  inputEl: HTMLInputElement;
  hintText?: string;
  errorText?: string;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.labelFor;
  label.className = 'nds-text-body nds-font-medium nds-text-foreground';
  label.textContent = opts.labelText;

  opts.inputEl.id = opts.labelFor;

  wrapper.appendChild(label);
  wrapper.appendChild(opts.inputEl);

  if (opts.hintText) {
    const hint = document.createElement('p');
    hint.className = 'nds-text-caption nds-text-muted-foreground';
    hint.textContent = opts.hintText;
    wrapper.appendChild(hint);
  }

  if (opts.errorText) {
    const error = document.createElement('p');
    error.className = 'nds-text-caption nds-text-destructive';
    error.id = `${opts.labelFor}-error`;
    error.textContent = opts.errorText;
    opts.inputEl.setAttribute('aria-describedby', `${opts.labelFor}-error`);
    wrapper.appendChild(error);
  }

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  render: () => {
    const input = createInput({ type: 'text', placeholder: 'ex: João da Silva' });
    return createFormField({
      labelText: 'Nome completo',
      labelFor: 'input-nome',
      inputEl: input,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label associado ao input via htmlFor', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await expect(input).toBeInTheDocument();
    });
  },
};

export const ComTextoDeApoio: Story = {
  render: () => {
    const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
    return createFormField({
      labelText: 'Email',
      labelFor: 'input-email-hint',
      inputEl: input,
      hintText: 'Usaremos este email para envio de notificações.',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label e hint text visíveis', async () => {
      await expect(canvas.getByLabelText('Email')).toBeInTheDocument();
      await expect(canvas.getByText('Usaremos este email para envio de notificações.')).toBeVisible();
    });
  },
};

export const ComMensagemDeErro: Story = {
  render: () => {
    const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
    input.setAttribute('aria-invalid', 'true');
    return createFormField({
      labelText: 'Email',
      labelFor: 'input-email-error',
      inputEl: input,
      errorText: 'Email inválido. Use o formato nome@dominio.com',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input com aria-invalid e mensagem de erro', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.getByText('Email inválido. Use o formato nome@dominio.com')).toBeVisible();
    });
    await step('Input tem aria-describedby apontando para mensagem de erro', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'input-email-error-error');
    });
  },
};

export const ComPrefixoTexto: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
  wrapper.dataset.spacing = 'xs';

    const label = document.createElement('label');
    label.htmlFor = 'input-url';
    label.className = 'nds-text-body nds-font-medium nds-text-foreground';
    label.textContent = 'URL do site';

    const row = document.createElement('div');
    row.className = 'nds-cluster nds-rounded-md nds-border-default nds-overflow-hidden';
    row.dataset.spacing = 'xs';

    const prefix = document.createElement('span');
    prefix.className = 'nds-cluster nds-text-body nds-text-muted-foreground nds-bg-muted nds-shrink-0';
    prefix.style.paddingInline = '0.75rem';
    prefix.style.borderInlineEnd = '1px solid hsl(var(--input))';
    prefix.textContent = 'https://';

    const input = createInput({ type: 'url', id: 'input-url', placeholder: 'meusite.com' });
    input.className = 'input border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1';

    row.appendChild(prefix);
    row.appendChild(input);
    wrapper.appendChild(label);
    wrapper.appendChild(row);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input com prefixo de texto visível', async () => {
      await expect(canvas.getByText('https://')).toBeVisible();
      await expect(canvas.getByLabelText('URL do site')).toBeInTheDocument();
    });
  },
};
