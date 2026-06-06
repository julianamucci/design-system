import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { createSwitch } from './switch';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Switch/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Switch: Unchecked, Checked, Disabled (desativado), DisabledChecked, Invalid (aria-invalid) e FocoVisivel. O factory custom expõe `role="switch"` + `aria-checked` automaticamente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper ───────────────────────────────────────────────────────────────────

function wrapWithLabel(sw: HTMLButtonElement, labelText: string, id: string, disabled = false): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  sw.id = id;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className =
    'nds-text-body nds-font-medium nds-leading-none ' +
    (disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
  if (disabled) {
    label.style.opacity = '0.7';
  }
  if (!disabled) {
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
  }
  row.append(sw, label);
  return row;
}

// ─── Unchecked ────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  render: () => wrapWithLabel(
    createSwitch({ checked: false }),
    'Receber notificações por email',
    'sw-unchecked',
  ),
  parameters: {
    docs: { description: { story: 'Estado padrão desativado. Fundo `bg-input`, thumb à esquerda, `aria-checked="false"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "false"', async () => {
      await expect(canvas.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });
    await step('data-state é "unchecked"', async () => {
      await expect(canvas.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

// ─── Checked ─────────────────────────────────────────────────────────────────

export const Checked: Story = {
  render: () => wrapWithLabel(
    createSwitch({ checked: true }),
    'Receber notificações por email',
    'sw-checked',
  ),
  parameters: {
    docs: { description: { story: 'Estado ativado. Fundo `bg-primary`, thumb à direita, `aria-checked="true"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "true"', async () => {
      await expect(canvas.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    await step('data-state é "checked"', async () => {
      await expect(canvas.getByRole('switch')).toHaveAttribute('data-state', 'checked');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => wrapWithLabel(
    createSwitch({ checked: false, disabled: true }),
    'Modo escuro',
    'sw-disabled',
    true,
  ),
  parameters: {
    docs: { description: { story: 'Switch desabilitado desativado. Opacidade reduzida, cursor bloqueado, não responde a interações.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Atributo disabled presente', async () => {
      await expect(sw).toBeDisabled();
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── DisabledChecked ─────────────────────────────────────────────────────────

export const DisabledChecked: Story = {
  render: () => wrapWithLabel(
    createSwitch({ checked: true, disabled: true }),
    'Modo escuro',
    'sw-disabled-checked',
    true,
  ),
  parameters: {
    docs: { description: { story: 'Switch desabilitado e ativado. Estado bloqueado para edição pelo usuário.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('aria-checked permanece "true"', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'sw-invalid';
    const sw = createSwitch({ id });
    sw.setAttribute('aria-invalid', 'true');
    sw.setAttribute('aria-describedby', 'sw-invalid-msg');
    sw.classList.add('nds-border-destructive');
    sw.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--destructive) 20%, transparent)';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Aceitar termos de uso';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    row.append(sw, label);

    const msg = document.createElement('p');
    msg.id = 'sw-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Você precisa ativar esta opção para continuar.';

    wrapper.append(row, msg);
    return wrapper;
  },
  parameters: {
    docs: { description: { story: 'Estado de erro via `aria-invalid="true"`. Borda e anel `destructive`. Mensagem associada via `aria-describedby`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('aria-invalid presente', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para a mensagem', async () => {
      await expect(sw).toHaveAttribute('aria-describedby', 'sw-invalid-msg');
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () => wrapWithLabel(
    createSwitch({}),
    'Foco visível via teclado',
    'sw-focus',
  ),
  parameters: {
    docs: { description: { story: 'Estado de foco via teclado. Pressione Tab para navegar e verificar o anel `ring-ring`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch recebe foco programaticamente', async () => {
      (sw as HTMLElement).focus();
      await expect(sw).toHaveFocus();
    });

    await step('Space alterna o estado quando focado', async () => {
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};
