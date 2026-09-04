import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  createPopover,
  createPopoverDescription,
  createPopoverTitle,
} from './popover';
import { centralizar, empilharCentrado, open, panel } from './popover.fixtures';
import { popoverSource, popoverSourceForm, popoverSourceWith } from './popover.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Popover/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          'Composicoes reais do Popover: EditarPerfil (form inline), FiltroDeTabela (checkboxes + ação), SeletorDeCor (swatches) e ConfiguracoesRapidas (toggles via inputs), mais a story de lado de abertura — arranjo do painel, não estado dele. Demonstra uso prático em fluxos comuns de produto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring';

async function waitForOpen(): Promise<void> {
  await waitFor(() => {
    if (!document.querySelector('[data-slot="popover-content"]')) throw new Error('popover fechado');
  }, { timeout: 1500 });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const EditProfile: Story = {
  parameters: {
    // Override de story: o formulário dentro do painel pede outra FORMA de
    // snippet — rótulo, campo e submit.
    docs: { source: { transform: popoverSourceForm({ triggerLabel: 'Editar perfil' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'sm';
    form.addEventListener('submit', (e) => e.preventDefault());

    const title = createPopoverTitle({ text: 'Dados do perfil' });

    const desc = createPopoverDescription({ text: 'As mudanças são salvas ao confirmar.' });

    const nameRow = document.createElement('div');
    nameRow.className = 'nds-stack';
    nameRow.dataset.spacing = 'xs';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pc-name' }),
      createInput({ id: 'pc-name', placeholder: 'Joana Silva', value: 'Joana Silva' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'nds-stack';
    emailRow.dataset.spacing = 'xs';
    emailRow.append(
      createLabel({ text: 'Email', htmlFor: 'pc-email' }),
      createInput({ id: 'pc-email', type: 'email', value: 'joana@example.com' }),
    );

    const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });

    form.append(title, desc, nameRow, emailRow, submit);

    const el = createPopover({ trigger, content: form });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ step }) => {
    await step('Form de perfil aberto com valores pré-preenchidos', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText('Nome')).toHaveValue('Joana Silva');
      await expect(ctx.getByLabelText(/email/i)).toHaveValue('joana@example.com');
    });
  },
};

export const TableFilter: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Filtros' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const title = createPopoverTitle({ text: 'Filtrar por status' });

    content.appendChild(title);

    const options = ['Ativo', 'Pendente', 'Arquivado'];
    for (const opt of options) {
      const row = document.createElement('label');
      row.className = 'nds-cluster nds-text-body';
      row.dataset.spacing = 'sm';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'nds-icon-sm';
      if (opt === 'Ativo') cb.checked = true;

      const text = document.createElement('span');
      text.textContent = opt;

      row.append(cb, text);
      content.appendChild(row);
    }

    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    actions.style.paddingTop = 'var(--spacing-2, 0.5rem)';
    const clear = createButton({ variant: 'ghost', size: 'sm', label: 'Limpar' });
    const apply = createButton({ variant: 'default', size: 'sm', label: 'Aplicar' });
    actions.append(clear, apply);
    content.appendChild(actions);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ step }) => {
    await step('Filtro mostra checkboxes e botões de ação', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText('Ativo')).toBeChecked();
      await expect(ctx.getByRole('button', { name: /aplicar/i })).toBeInTheDocument();
    });
  },
};

export const ColorPicker: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Escolher cor da etiqueta' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const title = createPopoverTitle({ text: 'Cor da etiqueta' });

    const grid = document.createElement('div');
    grid.className = 'nds-grid';
    grid.dataset.cols = '6';
    grid.dataset.spacing = 'xs';

    // A cor sai de token do tema, nunca de hexadecimal cravado: trocar de marca
    // reescreve a paleta sem tocar na story, e o painel continua legível no
    // tema escuro. Mesma paleta e mesmos nomes das outras quatro stacks.
    const swatches = [
      { name: 'Primária',    className: 'nds-bg-primary'     },
      { name: 'Secundária',  className: 'nds-bg-secondary'   },
      { name: 'Sucesso',     className: 'nds-bg-success'     },
      { name: 'Atenção',     className: 'nds-bg-warning'     },
      { name: 'Informação',  className: 'nds-bg-info'        },
      { name: 'Destrutiva',  className: 'nds-bg-destructive' },
    ];

    for (const s of swatches) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `${SWATCH_CLASSES} ${s.className}`;
      btn.setAttribute('aria-label', s.name);
      grid.appendChild(btn);
    }

    content.append(title, grid);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ step }) => {
    await step('Grid de swatches com aria-label por cor', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByRole('button', { name: 'Primária' })).toBeInTheDocument();
      await expect(ctx.getByRole('button', { name: 'Destrutiva' })).toBeInTheDocument();
    });
    await step('Foco navega entre swatches via Tab', async () => {
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const first = within(panel!).getByRole('button', { name: 'Primária' });
      first.focus();
      await expect(first).toHaveFocus();
      await userEvent.tab();
      const second = within(panel!).getByRole('button', { name: 'Secundária' });
      await expect(second).toHaveFocus();
    });
  },
};

export const QuickSettings: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Configuracoes' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const title = createPopoverTitle({ text: 'Preferências rápidas' });
    content.appendChild(title);

    const toggles = [
      { id: 'cfg-notifs',  label: 'Notificações',  checked: true  },
      { id: 'cfg-dark',    label: 'Modo escuro',   checked: false },
      { id: 'cfg-compact', label: 'Modo compacto', checked: false },
    ];

    for (const t of toggles) {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'sm';
      row.dataset.justify = 'between';

      const label = createLabel({ text: t.label, htmlFor: t.id });
      label.className = 'nds-text-body';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = t.id;
      cb.className = 'nds-icon-sm';
      cb.checked = t.checked;

      row.append(label, cb);
      content.appendChild(row);
    }

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
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
  },
};

export const SideTop: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: o lado é o assunto, e `side` não passa por control
    // neste arquivo.
    docs: {
      source: { transform: popoverSourceWith({ side: 'top', triggerLabel: 'Abrir acima' }) },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir acima' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';
    content.append(
      createPopoverTitle({ text: 'Ancorado acima' }),
      createPopoverDescription({ text: 'Sem espaço acima, o painel vira para baixo sozinho.' }),
    );

    const el = createPopover({ trigger, content, side: 'top' });
    queueMicrotask(() => trigger.click());

    // Espaço ACIMA do gatilho, senão o painel não cabe e o auto-flip o manda
    // para baixo — a story mediria o recurso oposto ao que documenta. Vem da
    // pilha (`margin-top: auto` no último filho) e de um degrau da escada, não
    // de um padding cravado.
    const w = empilharCentrado([el], 'nds-min-h-100');
    w.dataset.split = 'last';
    return w;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir acima' });

    await step('O painel é posicionado acima do gatilho', async () => {
      const p = await open(trigger);
      const rg = trigger.getBoundingClientRect();
      const rp = p.getBoundingClientRect();
      await expect(rp.bottom).toBeLessThanOrEqual(rg.top + 1);
    });

    await step('E continua alinhado ao gatilho no outro eixo', async () => {
      const rg = trigger.getBoundingClientRect();
      const rp = panel()!.getBoundingClientRect();
      const centerTrigger = rg.left + rg.width / 2;
      const centerPanel = rp.left + rp.width / 2;
      await expect(Math.abs(centerTrigger - centerPanel)).toBeLessThanOrEqual(2);
    });
  },
};
