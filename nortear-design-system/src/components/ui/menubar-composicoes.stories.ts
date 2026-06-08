import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Menubar/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Menubar: ComShortcuts, ComCheckboxItems, ComRadioGroup e EditorCompleto. NOTA: a factory createMenubar (Basecoat) NÃO suporta submenu nativo (sem MenubarSub/SubTrigger/SubContent). A composição ComSubmenu foi OMITIDA intencionalmente — para hierarquia, prefira reorganizar os menus ou utilizar as stacks React/Vue/Svelte que possuem submenu via base-ui/reka-ui/bits-ui.',
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
  wrapper.style.minHeight = '260px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    // Scope to the menubar primitive only — Storybook UI also has aria-haspopup buttons.
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

function injectCheckbox(panel: HTMLElement, label: string, checked: boolean): void {
  const item = document.createElement('div');
  item.setAttribute('role', 'menuitemcheckbox');
  item.setAttribute('aria-checked', String(checked));
  item.setAttribute('tabindex', '0');
  if (checked) item.dataset.state = 'checked';
  item.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent';

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

  item.addEventListener('click', () => {
    const next = item.getAttribute('aria-checked') !== 'true';
    item.setAttribute('aria-checked', String(next));
    item.dataset.state = next ? 'checked' : 'unchecked';
  });

  panel.appendChild(item);
}

function injectRadio(panel: HTMLElement, label: string, checked: boolean): void {
  const item = document.createElement('div');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', String(checked));
  item.setAttribute('tabindex', '0');
  if (checked) item.dataset.state = 'checked';
  item.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent';

  const indicator = document.createElement('span');
  indicator.className = 'nds-cluster nds-icon-sm';
  indicator.dataset.justify = 'center';
  indicator.style.display = 'inline-flex';
  indicator.setAttribute('aria-hidden', 'true');
  if (checked) {
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', '8');
    svg.setAttribute('height', '8');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    svg.appendChild(circle);
    indicator.appendChild(svg);
  }
  const text = document.createElement('span');
  text.textContent = label;
  item.append(indicator, text);

  item.addEventListener('click', () => {
    panel.querySelectorAll<HTMLElement>('[role="menuitemradio"]').forEach((el) => {
      el.setAttribute('aria-checked', 'false');
      el.dataset.state = 'unchecked';
    });
    item.setAttribute('aria-checked', 'true');
    item.dataset.state = 'checked';
  });
  panel.appendChild(item);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComShortcuts: Story = {
  name: 'Com Shortcuts',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Editar',
        items: [
          { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
          { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
          { type: 'separator' },
          { type: 'item', label: 'Recortar', shortcut: '⌘X' },
          { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
          { type: 'item', label: 'Colar',    shortcut: '⌘V' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Items exibem shortcut visualmente', async () => {
      await waitFor(() => {
        if (!document.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const items = document.querySelectorAll('[role="menu"]:not(.hidden) [role="menuitem"]');
      await expect(items.length).toBe(5);
      const text = (items[0].textContent || '').trim();
      await expect(text).toMatch(/⌘Z/);
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const ComCheckboxItems: Story = {
  name: 'Com Checkbox Items',
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
    const panel = bar.querySelector<HTMLElement>('[role="menu"]');
    if (panel) {
      injectCheckbox(panel, 'Barra lateral', true);
      injectCheckbox(panel, 'Barra de status', true);
      injectCheckbox(panel, 'Régua', false);
    }
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Menu contém menuitemcheckbox', async () => {
      await waitFor(() => {
        if (!document.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const items = document.querySelectorAll(
        '[role="menu"]:not(.hidden) [role="menuitemcheckbox"]',
      );
      await expect(items.length).toBe(3);
      const checked = document.querySelectorAll(
        '[role="menu"]:not(.hidden) [role="menuitemcheckbox"][aria-checked="true"]',
      );
      await expect(checked.length).toBe(2);
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const ComRadioGroup: Story = {
  name: 'Com Radio Group',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Tema',
        items: [
          { type: 'label', label: 'Aparência' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    const panel = bar.querySelector<HTMLElement>('[role="menu"]');
    if (panel) {
      injectRadio(panel, 'Claro',    false);
      injectRadio(panel, 'Escuro',   true);
      injectRadio(panel, 'Sistema',  false);
    }
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Menu contém menuitemradio com apenas um checked', async () => {
      await waitFor(() => {
        if (!document.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const items = document.querySelectorAll(
        '[role="menu"]:not(.hidden) [role="menuitemradio"]',
      );
      await expect(items.length).toBe(3);
      const checked = document.querySelectorAll(
        '[role="menu"]:not(.hidden) [role="menuitemradio"][aria-checked="true"]',
      );
      await expect(checked.length).toBe(1);
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const EditorCompleto: Story = {
  name: 'Editor Completo',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',          shortcut: '⌘N' },
          { type: 'item', label: 'Abrir...',      shortcut: '⌘O' },
          { type: 'item', label: 'Salvar',        shortcut: '⌘S' },
          { type: 'item', label: 'Salvar como...', shortcut: '⇧⌘S' },
          { type: 'separator' },
          { type: 'item', label: 'Sair',          shortcut: '⌘Q' },
        ],
      },
      {
        label: 'Editar',
        items: [
          { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
          { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
          { type: 'separator' },
          { type: 'item', label: 'Recortar', shortcut: '⌘X' },
          { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
          { type: 'item', label: 'Colar',    shortcut: '⌘V' },
        ],
      },
      {
        label: 'Exibir',
        items: [
          { type: 'label', label: 'Aparência' },
          { type: 'item',  label: 'Modo escuro' },
          { type: 'item',  label: 'Mostrar barra lateral' },
          { type: 'separator' },
          { type: 'item',  label: 'Tela cheia', shortcut: 'F11' },
        ],
      },
      {
        label: 'Ajuda',
        items: [
          { type: 'item', label: 'Documentação' },
          { type: 'item', label: 'Atalhos de teclado', shortcut: '⌘?' },
          { type: 'separator' },
          { type: 'item', label: 'Sobre' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    return wrap(bar);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Barra renderiza 4 menus', async () => {
      const triggers = canvas.getAllByRole('menuitem');
      await expect(triggers.length).toBe(4);
    });
    await step('Click em Editar abre menu correspondente', async () => {
      const editar = canvas.getByRole('menuitem', { name: /editar/i });
      await userEvent.click(editar);
      await waitFor(() => {
        if (editar.getAttribute('aria-expanded') !== 'true') {
          throw new Error('Editar não abriu');
        }
      });
    });
    await step('Limpa via ESC', closeAfter);
  },
};
