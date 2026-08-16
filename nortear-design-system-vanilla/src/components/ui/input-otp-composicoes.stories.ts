import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { createButton } from './button';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/InputOTP/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do InputOTP: WithLabel (rótulo visível associado), WithHelpText (origem + validade), WithErrorMessage (aria-describedby + aria-invalid) e WithResendButton (botão para reenviar o código).',
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

function coluna(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-stack';
  root.dataset.spacing = 'sm';
  root.style.width = 'fit-content';
  return root;
}

function rotulo(texto: string, id?: string): HTMLElement {
  const label = document.createElement('span');
  label.className = 'nds-text-label';
  if (id) label.id = id;
  label.textContent = texto;
  return label;
}

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6 });
    otp.removeAttribute('aria-label');
    otp.setAttribute('aria-labelledby', 'comp-label-texto');
    root.append(rotulo('Código de verificação', 'comp-label-texto'), otp);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível é o nome do conjunto', async () => {
      // `aria-labelledby` tem precedência sobre o `aria-label` padrão — o texto
      // que a pessoa vê é o mesmo que o leitor anuncia.
      await expect(canvas.getByRole('group', { name: 'Código de verificação' })).toBeTruthy();
    });
  },
};

export const WithHelpText: Story = {
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6, describedBy: 'comp-ajuda-texto' });
    const help = document.createElement('p');
    help.id = 'comp-ajuda-texto';
    help.className = 'nds-text-caption nds-text-muted-foreground';
    help.textContent = 'Enviamos por SMS, expira em 5 min.';
    root.append(rotulo('Código de verificação'), otp, help);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    await step('A ajuda é lida junto com o campo', async () => {
      const slot = slotsDe(canvasElement)[0];
      await expect(slot).toHaveAttribute('aria-describedby', 'comp-ajuda-texto');
      await expect(canvasElement.querySelector('#comp-ajuda-texto')?.textContent).toContain('SMS');
    });
  },
};

export const WithErrorMessage: Story = {
  name: 'With error message',
  render: () => {
    const root = coluna();
    const otp = createInputOTP({
      length: 6,
      value: '482913',
      invalid: true,
      describedBy: 'comp-erro-texto',
    });
    const err = document.createElement('p');
    err.id = 'comp-erro-texto';
    err.className = 'nds-text-caption nds-text-destructive';
    err.textContent = 'Código incorreto. Verifique e tente novamente.';
    root.append(rotulo('Código de verificação'), otp, err);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    await step('Causa e ação corretiva chegam pelo mesmo caminho do erro', async () => {
      const slot = slotsDe(canvasElement)[0];
      await expect(slot).toHaveAttribute('aria-invalid', 'true');
      await expect(slot).toHaveAttribute('aria-describedby', 'comp-erro-texto');
      await expect(canvasElement.querySelector('#comp-erro-texto')?.textContent).toContain(
        'tente novamente',
      );
    });
  },
};

export const WithResendButton: Story = {
  name: 'With resend button',
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6 });

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'xs';
    row.dataset.align = 'center';

    const note = document.createElement('span');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'Não recebeu?';

    row.append(note, createButton({ variant: 'link', size: 'sm', label: 'Reenviar código' }));
    root.append(rotulo('Código de verificação'), otp, row);
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O reenvio é alcançável pelo teclado depois do último slot', async () => {
      // O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
      // código encontra o reenvio no próximo Tab, sem voltar pelo caminho.
      const slots = slotsDe(canvasElement);
      slots[slots.length - 1].focus();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Reenviar código' })).toHaveFocus();
    });
  },
};
