import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { createButton } from './button';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/InputOTP/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do InputOTP: ComLabel (label visível associado), ComHelpText (origem + validade), ComErrorMessage (aria-describedby + aria-invalid) e ComResendButton (botão para reenviar código).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

function setAriaDescribedBy(otp: HTMLElement, id: string): void {
  const inputs = Array.from(otp.querySelectorAll('input')) as HTMLInputElement[];
  for (const input of inputs) input.setAttribute('aria-describedby', id);
}

function applyError(otp: HTMLElement): void {
  const inputs = Array.from(otp.querySelectorAll('input')) as HTMLInputElement[];
  for (const input of inputs) {
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('border-destructive');
    input.style.boxShadow = '0 0 0 2px hsl(var(--destructive) / 0.2)';
  }
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  name: 'Com Label',
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.width = 'fit-content';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.id = 'otp-label-1';
    label.textContent = 'Código de verificação';

    const otp = createInputOTP({ length: 6 });
    otp.setAttribute('aria-labelledby', 'otp-label-1');

    root.append(label, otp);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label associado via aria-labelledby', async () => {
      const text = canvas.getByText(/Código de verificação/);
      await expect(text).toBeVisible();
    });
  },
};

export const ComHelpText: Story = {
  name: 'Com Help Text',
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.width = 'fit-content';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Código de verificação';

    const otp = createInputOTP({ length: 6 });
    setAriaDescribedBy(otp, 'otp-help-1');

    const help = document.createElement('p');
    help.id = 'otp-help-1';
    help.className = 'nds-text-caption nds-text-muted-foreground';
    help.textContent = 'Enviamos por SMS, expira em 5 min.';

    root.append(label, otp, help);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Help text visível e conectado via aria-describedby', async () => {
      const help = canvas.getByText(/Enviamos por SMS/);
      await expect(help).toBeVisible();
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs[0].getAttribute('aria-describedby')).toBe('otp-help-1');
    });
  },
};

export const ComErrorMessage: Story = {
  name: 'Com Mensagem de Erro',
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.width = 'fit-content';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Código de verificação';

    const otp = createInputOTP({ length: 6 });
    applyError(otp);
    setAriaDescribedBy(otp, 'otp-error-1');

    const err = document.createElement('p');
    err.id = 'otp-error-1';
    err.className = 'nds-text-caption nds-text-destructive';
    err.textContent = 'Código incorreto. Verifique e tente novamente.';

    root.append(label, otp, err);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Mensagem de erro visível e aria-invalid aplicado', async () => {
      const err = canvas.getByText(/Código incorreto/);
      await expect(err).toBeVisible();
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    });
  },
};

export const ComResendButton: Story = {
  name: 'Com Botão Reenviar',
  render: () => {
    const root = document.createElement('div');
    root.className = 'flex flex-col gap-3 w-fit';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Código de verificação';

    const otp = createInputOTP({ length: 6 });

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';
    row.dataset.spacing = 'md';

    const note = document.createElement('p');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'Não recebeu?';

    const btn = createButton({ variant: 'link', label: 'Reenviar código' });

    row.append(note, btn);
    root.append(label, otp, row);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão reenviar é clicável', async () => {
      const btn = canvas.getByRole('button', { name: /Reenviar código/i });
      await userEvent.click(btn);
      await expect(btn).toBeVisible();
    });
  },
};
