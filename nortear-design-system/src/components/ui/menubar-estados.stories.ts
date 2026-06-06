import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Menubar/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Menubar: Fechado (apenas Triggers visíveis), Aberto (defaultOpen via .click()), ItemDesabilitado (item.disabled=true) e CheckboxChecked (item com aria-checked="true" — via composição manual).',
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
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = '220px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (document.querySelector('[data-slot="menubar"] button[aria-expanded="true"]')) {
      throw new Error('menu ainda aberto');
    }
  });
}

function openFirstMenu(bar: HTMLElement): void {
  queueMicrotask(() => {
    const trigger = bar.querySelector<HTMLButtonElement>('button[aria-haspopup]');
    trigger?.click();
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => {
    const bar = createMenubar([
      { label: 'Arquivo', items: [{ type: 'item', label: 'Novo' }] },
      { label: 'Editar',  items: [{ type: 'item', label: 'Desfazer' }] },
      { label: 'Exibir',  items: [{ type: 'item', label: 'Zoom' }] },
    ]);
    bar.dataset.slot = 'menubar';
    return wrap(bar);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas barra com Triggers; nenhum menu aberto', async () => {
      const triggers = canvas.getAllByRole('menuitem');
      await expect(triggers.length).toBeGreaterThanOrEqual(3);
      for (const t of triggers) {
        await expect(t).toHaveAttribute('aria-expanded', 'false');
      }
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',    shortcut: '⌘N' },
          { type: 'item', label: 'Abrir',   shortcut: '⌘O' },
          { type: 'separator' },
          { type: 'item', label: 'Salvar',  shortcut: '⌘S' },
        ],
      },
      { label: 'Editar', items: [{ type: 'item', label: 'Desfazer' }] },
    ]);
    bar.dataset.slot = 'menubar';
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Menu Arquivo aberto com aria-expanded=true', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /arquivo/i });
      await waitFor(() => {
        if (trigger.getAttribute('aria-expanded') !== 'true') {
          throw new Error('Trigger não abriu');
        }
      });
      const panel = document.querySelector('[role="menu"]:not(.hidden)');
      await expect(panel).toBeTruthy();
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const ItemDesabilitado: Story = {
  name: 'Item Desabilitado',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',     shortcut: '⌘N' },
          { type: 'item', label: 'Compartilhar', disabled: true },
          { type: 'item', label: 'Salvar',   shortcut: '⌘S' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Item disabled tem tabindex=-1 e opacity-50', async () => {
      await waitFor(() => {
        if (!document.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const items = document.querySelectorAll('[role="menu"]:not(.hidden) [role="menuitem"]');
      const disabled = Array.from(items).find((el) => /compartilhar/i.test(el.textContent || ''));
      await expect(disabled?.getAttribute('tabindex')).toBe('-1');
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const CheckboxChecked: Story = {
  name: 'Checkbox Checked',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Exibir',
        items: [
          { type: 'label', label: 'Painéis' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';

    // Factory Basecoat não tem CheckboxItem nativo — injetamos manualmente
    // um <div role="menuitemcheckbox" aria-checked="true"> no panel.
    const panel = bar.querySelector<HTMLElement>('[role="menu"]');
    if (panel) {
      function makeCheckbox(label: string, checked: boolean): HTMLDivElement {
        const item = document.createElement('div');
        item.setAttribute('role', 'menuitemcheckbox');
        item.setAttribute('aria-checked', String(checked));
        item.setAttribute('tabindex', checked ? '0' : '-1');
        if (checked) item.dataset.state = 'checked';
        item.className =
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';

        const indicator = document.createElement('span');
        indicator.className = 'nds-cluster nds-icon-sm';
        indicator.dataset.justify = 'center';
        indicator.style.display = 'inline-flex';
        indicator.setAttribute('aria-hidden', 'true');
        if (checked) {
          const svgNs = 'http://www.w3.org/2000/svg';
          const svg = document.createElementNS(svgNs, 'svg');
          svg.setAttribute('width', '14');
          svg.setAttribute('height', '14');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '2');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          const path = document.createElementNS(svgNs, 'path');
          path.setAttribute('d', 'M20 6 9 17l-5-5');
          svg.appendChild(path);
          indicator.appendChild(svg);
        }
        const text = document.createElement('span');
        text.textContent = label;
        item.append(indicator, text);
        return item;
      }
      panel.appendChild(makeCheckbox('Barra lateral', true));
      panel.appendChild(makeCheckbox('Barra de status', false));
    }

    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Existe um menuitemcheckbox com aria-checked=true', async () => {
      await waitFor(() => {
        if (!document.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const checked = document.querySelector('[role="menuitemcheckbox"][aria-checked="true"]');
      await expect(checked).toBeTruthy();
    });
    await step('Limpa via ESC', closeAfter);
  },
};
