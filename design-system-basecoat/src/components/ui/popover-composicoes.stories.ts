import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

const meta: Meta = {
  title: 'UI/Popover/Composições',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais do Popover: EditarPerfil (form inline), FiltroDeTabela (checkboxes + ação), SeletorDeCor (swatches) e ConfiguracoesRapidas (toggles via inputs). Demonstra uso prático em fluxos comuns de produto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const w = document.createElement('div');
  w.style.contain = 'layout';
  w.className = 'w-full min-h-[300px] flex items-center justify-center';
  w.appendChild(child);
  return w;
}

async function waitForOpen(): Promise<void> {
  await waitFor(() => {
    if (!document.querySelector('[data-slot="popover-content"]')) throw new Error('popover fechado');
  }, { timeout: 1500 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
  await waitFor(() => {
    if (document.querySelector('[data-slot="popover-content"]')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const EditarPerfil: Story = {
  name: 'Editar Perfil',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.addEventListener('submit', (e) => e.preventDefault());

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium leading-none';
    title.textContent = 'Dados do perfil';

    const desc = document.createElement('p');
    desc.className = 'text-xs text-muted-foreground';
    desc.textContent = 'As mudanças são salvas ao confirmar.';

    const nameRow = document.createElement('div');
    nameRow.className = 'space-y-1';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pc-name' }),
      createInput({ id: 'pc-name', placeholder: 'Joana Silva', value: 'Joana Silva' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'space-y-1';
    emailRow.append(
      createLabel({ text: 'Email', htmlFor: 'pc-email' }),
      createInput({ id: 'pc-email', type: 'email', value: 'joana@example.com' }),
    );

    const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });

    form.append(title, desc, nameRow, emailRow, submit);

    const el = createPopover({ trigger, content: form });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Form de perfil aberto com valores pré-preenchidos', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText(/nome/i)).toHaveValue('Joana Silva');
      await expect(ctx.getByLabelText(/email/i)).toHaveValue('joana@example.com');
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const FiltroDeTabela: Story = {
  name: 'Filtro de Tabela',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Filtros' });

    const content = document.createElement('div');
    content.className = 'space-y-2';

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium leading-none';
    title.textContent = 'Filtrar por status';

    content.appendChild(title);

    const options = ['Ativo', 'Pendente', 'Arquivado'];
    for (const opt of options) {
      const row = document.createElement('label');
      row.className = 'flex items-center gap-2 text-sm';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'h-4 w-4';
      if (opt === 'Ativo') cb.checked = true;

      const text = document.createElement('span');
      text.textContent = opt;

      row.append(cb, text);
      content.appendChild(row);
    }

    const actions = document.createElement('div');
    actions.className = 'flex justify-end gap-2 pt-2';
    const clear = createButton({ variant: 'ghost', size: 'sm', label: 'Limpar' });
    const apply = createButton({ variant: 'default', size: 'sm', label: 'Aplicar' });
    actions.append(clear, apply);
    content.appendChild(actions);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Filtro mostra checkboxes e botões de ação', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText(/ativo/i)).toBeChecked();
      await expect(ctx.getByRole('button', { name: /aplicar/i })).toBeInTheDocument();
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const SeletorDeCor: Story = {
  name: 'Seletor de Cor',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Cor' });

    const content = document.createElement('div');
    content.className = 'space-y-2';

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium leading-none';
    title.textContent = 'Selecionar cor';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-6 gap-2';

    const swatches = [
      { name: 'Vermelho',  bg: 'bg-red-500'    },
      { name: 'Laranja',   bg: 'bg-orange-500' },
      { name: 'Amarelo',   bg: 'bg-yellow-500' },
      { name: 'Verde',     bg: 'bg-green-500'  },
      { name: 'Azul',      bg: 'bg-blue-500'   },
      { name: 'Roxo',      bg: 'bg-purple-500' },
    ];

    for (const s of swatches) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring ${s.bg}`;
      btn.setAttribute('aria-label', s.name);
      grid.appendChild(btn);
    }

    content.append(title, grid);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Grid de swatches com aria-label por cor', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByRole('button', { name: /vermelho/i })).toBeInTheDocument();
      await expect(ctx.getByRole('button', { name: /azul/i })).toBeInTheDocument();
    });
    await step('Foco navega entre swatches via Tab', async () => {
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const first = within(panel!).getByRole('button', { name: /vermelho/i });
      first.focus();
      await expect(first).toHaveFocus();
      await userEvent.tab();
      const second = within(panel!).getByRole('button', { name: /laranja/i });
      await expect(second).toHaveFocus();
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const ConfiguracoesRapidas: Story = {
  name: 'Configurações Rápidas',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Configurações' });

    const content = document.createElement('div');
    content.className = 'space-y-3';

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium leading-none';
    title.textContent = 'Preferências rápidas';
    content.appendChild(title);

    const toggles = [
      { id: 'cfg-notifs',  label: 'Notificações',  checked: true  },
      { id: 'cfg-dark',    label: 'Modo escuro',   checked: false },
      { id: 'cfg-compact', label: 'Modo compacto', checked: false },
    ];

    for (const t of toggles) {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-3';

      const label = createLabel({ text: t.label, htmlFor: t.id });
      label.className = 'text-sm';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = t.id;
      cb.className = 'h-4 w-4';
      cb.checked = t.checked;

      row.append(label, cb);
      content.appendChild(row);
    }

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Toggles renderizam com estados iniciais', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText(/notificações/i)).toBeChecked();
      await expect(ctx.getByLabelText(/modo escuro/i)).not.toBeChecked();
      await expect(ctx.getByLabelText(/modo compacto/i)).not.toBeChecked();
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};
