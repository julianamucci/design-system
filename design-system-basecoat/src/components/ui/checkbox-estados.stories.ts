import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { createCheckbox } from './checkbox';

const meta: Meta = {
  title: 'UI/Checkbox/Estados',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked, checked, disabled (desmarcado), disabled (marcado) e error (aria-invalid). O estado indeterminate não é suportado no Basecoat — disponível apenas no Svelte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper local ─────────────────────────────────────────────────────────────

function wrapWithLabel(cb: HTMLElement, labelText: string, id: string, disabled = false): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-2';
  cb.id = id;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'text-sm font-medium leading-none' + (disabled ? ' cursor-not-allowed opacity-70' : ' cursor-pointer');
  wrapper.append(cb, label);
  return wrapper;
}

// ─── Unchecked ────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: false }),
    'Aceito os termos e condições',
    'cb-unchecked',
  ),
  parameters: {
    docs: { description: { story: 'Estado padrão desmarcado. Borda `--input`, fundo transparente, `aria-checked="false"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "false"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    });
    await step('data-state é "unchecked"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

// ─── Checked ─────────────────────────────────────────────────────────────────

export const Checked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: true }),
    'Aceito os termos e condições',
    'cb-checked',
  ),
  parameters: {
    docs: { description: { story: 'Estado marcado. Fundo `--primary`, CheckIcon visível, `aria-checked="true"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "true"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    });
    await step('data-state é "checked"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });
  },
};

// ─── DisabledUnchecked ────────────────────────────────────────────────────────

export const DisabledUnchecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: false, disabled: true }),
    'Manter sessão ativa',
    'cb-disabled-unchecked',
    true,
  ),
  parameters: {
    docs: { description: { story: 'Estado desabilitado desmarcado. Opacidade reduzida, cursor bloqueado, não responde a interações.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('aria-disabled está presente', async () => {
      await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });

    await step('tabindex é -1 (não recebe foco por teclado)', async () => {
      await expect(checkbox).toHaveAttribute('tabindex', '-1');
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── DisabledChecked ─────────────────────────────────────────────────────────

export const DisabledChecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: true, disabled: true }),
    'Manter sessão ativa',
    'cb-disabled-checked',
    true,
  ),
  parameters: {
    docs: { description: { story: 'Estado desabilitado marcado. Não pode ser alterado pelo usuário.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('aria-checked permanece "true"', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── Error ────────────────────────────────────────────────────────────────────

export const Error: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-1.5';

    const row = document.createElement('div');
    row.className = 'flex items-center gap-2';

    const id = 'cb-error';
    const cb = createCheckbox({ id });
    cb.setAttribute('aria-invalid', 'true');
    cb.setAttribute('aria-describedby', 'cb-error-msg');

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Aceito os termos e condições';
    label.className = 'text-sm font-medium leading-none cursor-pointer';

    row.append(cb, label);

    const msg = document.createElement('p');
    msg.id = 'cb-error-msg';
    msg.className = 'text-sm text-destructive';
    msg.textContent = 'Você precisa aceitar os termos para continuar.';

    wrapper.append(row, msg);
    return wrapper;
  },
  parameters: {
    docs: { description: { story: 'Estado de erro via `aria-invalid="true"`. Ring e borda `--destructive`. Mensagem de erro associada via `aria-describedby`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-invalid está presente', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para mensagem de erro', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-describedby', 'cb-error-msg');
    });
  },
};
