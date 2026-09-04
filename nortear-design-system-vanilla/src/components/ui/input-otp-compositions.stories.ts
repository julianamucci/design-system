import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { createButton } from './button';
import { wrap } from './input-otp.fixtures';
import { inputOtpSource, inputOtpSourceComposition } from './input-otp.source';

const meta: Meta = {
  tags: ['form'],
  title: 'Components/Form/InputOTP/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: inputOtpSource },
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

/**
 * Aqui a coluna tem rótulo, campo e mensagem — não cabe nos 120px de
 * `nds-min-h-30`, que é a medida das outras stories. Não há utilitário nesta
 * altura, então ela vai por `style`, pela porta que `wrap` abre para isso.
 */
const FRAME_HEIGHT = '180px';

function coluna(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-stack';
  root.dataset.spacing = 'sm';
  root.style.width = 'fit-content';
  return root;
}

function label(text: string, id?: string): HTMLElement {
  const label = document.createElement('span');
  label.className = 'nds-text-label';
  if (id) label.id = id;
  label.textContent = text;
  return label;
}

const slotsDe = (root: HTMLElement): HTMLInputElement[] => [
  ...root.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  // O rótulo visível só vira nome do conjunto pelo `aria-labelledby`, que é
  // marcação em volta do campo — não aparece na chamada da fábrica.
  parameters: {
    docs: {
      source: {
        transform: inputOtpSourceComposition({
          label: 'Código de verificação',
          ligarRotulo: true,
        }),
      },
    },
  },
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6 });
    otp.removeAttribute('aria-label');
    otp.setAttribute('aria-labelledby', 'comp-label-texto');
    root.append(label('Código de verificação', 'comp-label-texto'), otp);
    return wrap(root, FRAME_HEIGHT);
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
  parameters: {
    docs: {
      source: {
        transform: inputOtpSourceComposition({
          label: 'Código de verificação',
          ajuda: 'Enviamos por SMS, expira em 5 min.',
        }),
      },
    },
  },
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6, describedBy: 'comp-ajuda-texto' });
    const help = document.createElement('p');
    help.id = 'comp-ajuda-texto';
    help.className = 'nds-text-caption nds-text-muted-foreground';
    help.textContent = 'Enviamos por SMS, expira em 5 min.';
    root.append(label('Código de verificação'), otp, help);
    return wrap(root, FRAME_HEIGHT);
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
  parameters: {
    docs: {
      source: {
        transform: inputOtpSourceComposition({
          label: 'Código de verificação',
          value: '482913',
          invalid: true,
          error: 'Código incorreto. Verifique e tente novamente.',
        }),
      },
    },
  },
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
    root.append(label('Código de verificação'), otp, err);
    return wrap(root, FRAME_HEIGHT);
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
  // Outra fábrica entra na composição: o reenvio é um `createButton` depois do
  // campo, e é a ORDEM do DOM que o põe no Tab seguinte ao último slot.
  parameters: {
    docs: {
      source: {
        transform: inputOtpSourceComposition({
          label: 'Código de verificação',
          reenvio: 'Reenviar código',
        }),
      },
    },
  },
  render: () => {
    const root = coluna();
    const otp = createInputOTP({ length: 6 });

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    row.dataset.align = 'center';

    const note = document.createElement('span');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'Não recebeu?';

    row.append(note, createButton({ variant: 'link', size: 'sm', label: 'Reenviar código' }));
    root.append(label('Código de verificação'), otp, row);
    return wrap(root, FRAME_HEIGHT);
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
