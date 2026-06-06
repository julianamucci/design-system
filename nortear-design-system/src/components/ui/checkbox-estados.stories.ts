import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { createCheckbox } from './checkbox';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Checkbox/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
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
  wrapper.className = 'nds-cluster';
  wrapper.dataset.spacing = 'sm';
  cb.id = id;
  const labelId = `${id}-label`;
  cb.setAttribute('aria-labelledby', labelId);
  const label = document.createElement('label');
  label.id = labelId;
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'nds-text-body nds-font-medium nds-leading-none ' + (disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
  label.addEventListener('click', (e) => {
    e.preventDefault();
    cb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  if (disabled) { label.style.opacity = '0.7'; label.style.cursor = 'not-allowed'; }
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
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'cb-error';
    const cb = createCheckbox({ id });
    cb.setAttribute('aria-invalid', 'true');
    cb.setAttribute('aria-describedby', 'cb-error-msg');

    const label = document.createElement('label');
    label.id = `${id}-label`;
    cb.setAttribute('aria-labelledby', `${id}-label`);
    label.htmlFor = id;
    label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    label.textContent = 'Aceito os termos e condições';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    row.append(cb, label);

    const msg = document.createElement('p');
    msg.id = 'cb-error-msg';
    msg.className = 'nds-text-body nds-text-destructive';
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

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () => wrapWithLabel(
    createCheckbox({}),
    'Foco visível via teclado',
    'cb-focus',
  ),
  parameters: {
    docs: { description: { story: 'Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco `--ring`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox recebe foco via teclado', async () => {
      (checkbox as HTMLElement).focus();
      await expect(checkbox).toHaveFocus();
    });
  },
};
