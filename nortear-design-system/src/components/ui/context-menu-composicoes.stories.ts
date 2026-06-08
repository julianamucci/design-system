import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, fn } from 'storybook/test';
import { createContextMenu } from './context-menu';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/ContextMenu/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes avançadas do ContextMenu: com checkbox simulado, radio group simulado, submenu inline e atalhos visuais.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTrigger(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'nds-cluster nds-rounded-md nds-text-body nds-text-muted-foreground nds-cursor-default';
  el.dataset.justify = 'center';
  el.style.width = '300px';
  el.style.height = '150px';
  el.style.border = '1px dashed hsl(var(--border))';
  el.style.userSelect = 'none';
  el.textContent = label;
  return el;
}

/** Cria SVG de check via DOM (sem innerHTML). */
function createCheckSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  svg.appendChild(path);
  return svg;
}

/** Cria SVG de ponto de radio via DOM (sem innerHTML). */
function createRadioDotSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '8');
  svg.setAttribute('height', '8');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '8');
  svg.appendChild(circle);
  return svg;
}

/** Cria SVG de chevron-right via DOM (sem innerHTML). */
function createChevronSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.appendChild(path);
  return svg;
}

// ─── ComCheckbox ──────────────────────────────────────────────────────────────

export const ComCheckbox: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Itens com indicador de marcação (CheckboxItem). Usa `role="menuitemcheckbox"` e `aria-checked`. SVG de check criado via DOM.',
      },
    },
  },
  render: () => {
    let showStatusBar = true;
    let showPanel = false;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Checkbox');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.dataset.slot = 'context-menu-content';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    function makeCheckboxItem(label: string, checked: boolean, onToggle: () => void): HTMLLIElement {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitemcheckbox');
      li.setAttribute('aria-checked', String(checked));
      li.className =
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
      li.setAttribute('tabindex', '-1');

      const indicator = document.createElement('span');
      indicator.className = 'flex h-3.5 w-3.5 items-center justify-center';
      if (checked) indicator.appendChild(createCheckSvg());

      const labelSpan = document.createElement('span');
      labelSpan.textContent = label;

      li.append(indicator, labelSpan);
      li.addEventListener('click', () => {
        checked = !checked;
        onToggle();
        li.setAttribute('aria-checked', String(checked));
        indicator.replaceChildren();
        if (checked) indicator.appendChild(createCheckSvg());
      });

      return li;
    }

    const sep1 = document.createElement('li');
    sep1.setAttribute('role', 'separator');
    sep1.className = '-mx-1 my-1 h-px bg-muted';

    const lbl = document.createElement('li');
    lbl.setAttribute('role', 'presentation');
    lbl.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
    lbl.textContent = 'Aparência';

    menu.append(
      makeCheckboxItem('Barra de Status', showStatusBar, () => { showStatusBar = !showStatusBar; }),
      makeCheckboxItem('Painel Lateral',  showPanel,     () => { showPanel = !showPanel; }),
      sep1,
      lbl,
    );

    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (!menu.contains(e.target as Node) && !t.contains(e.target as Node)) closeMenu();
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger presente', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Checkbox/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── ComRadio ─────────────────────────────────────────────────────────────────

export const ComRadio: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'RadioGroup simulado: seleção exclusiva entre opções de visualização. Usa `role="menuitemradio"` e `aria-checked`. SVG criado via DOM.',
      },
    },
  },
  render: () => {
    let selected = 'compact';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Radio');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.dataset.slot = 'context-menu-content';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    const options = [
      { value: 'compact',     label: 'Compacto'    },
      { value: 'comfortable', label: 'Confortável' },
      { value: 'spacious',    label: 'Espaçoso'    },
    ];

    function buildItems() {
      menu.replaceChildren();
      const lbl = document.createElement('li');
      lbl.setAttribute('role', 'presentation');
      lbl.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
      lbl.textContent = 'Modo de exibição';
      menu.appendChild(lbl);

      options.forEach((opt) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'menuitemradio');
        li.setAttribute('aria-checked', String(opt.value === selected));
        li.className =
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
        li.setAttribute('tabindex', '-1');

        const indicator = document.createElement('span');
        indicator.className = 'flex h-3.5 w-3.5 items-center justify-center';
        if (opt.value === selected) indicator.appendChild(createRadioDotSvg());

        const labelSpan = document.createElement('span');
        labelSpan.textContent = opt.label;

        li.append(indicator, labelSpan);
        li.addEventListener('click', () => {
          selected = opt.value;
          buildItems();
          closeMenu();
        });
        menu.appendChild(li);
      });
    }

    buildItems();
    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (!menu.contains(e.target as Node) && !t.contains(e.target as Node)) closeMenu();
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      buildItems();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger presente', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Radio/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── ComSubmenu ───────────────────────────────────────────────────────────────

export const ComSubmenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Submenu inline: item "Compartilhar" exibe sub-opções ao ser focado/clicado. SubTrigger com ChevronRight via DOM; SubContent posicionado à direita.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Submenu');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    function makeItem(label: string, onClick?: () => void): HTMLLIElement {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className =
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
      li.setAttribute('tabindex', '-1');
      li.textContent = label;
      if (onClick) li.addEventListener('click', onClick);
      return li;
    }

    // SubTrigger
    const subTrigger = document.createElement('li');
    subTrigger.setAttribute('role', 'menuitem');
    subTrigger.setAttribute('aria-haspopup', 'menu');
    subTrigger.setAttribute('aria-expanded', 'false');
    subTrigger.className =
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
    subTrigger.setAttribute('tabindex', '-1');

    const subLabel = document.createElement('span');
    subLabel.className = 'flex-1';
    subLabel.textContent = 'Compartilhar';

    const chevronWrapper = document.createElement('span');
    chevronWrapper.appendChild(createChevronSvg());

    subTrigger.append(subLabel, chevronWrapper);

    // SubContent
    const subContent = document.createElement('ul');
    subContent.setAttribute('role', 'menu');
    subContent.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    subContent.style.position = 'absolute';
    subContent.style.display = 'none';
    subContent.append(
      makeItem('Por e-mail', fn()),
      makeItem('Por link',   fn()),
    );
    document.body.appendChild(subContent);

    function openSub() {
      const rect = subTrigger.getBoundingClientRect();
      subContent.style.top  = `${rect.top  + window.scrollY}px`;
      subContent.style.left = `${rect.right + window.scrollX + 4}px`;
      subContent.style.display = 'block';
      subTrigger.setAttribute('aria-expanded', 'true');
    }

    function closeSub() {
      subContent.style.display = 'none';
      subTrigger.setAttribute('aria-expanded', 'false');
    }

    subTrigger.addEventListener('mouseenter', openSub);
    subTrigger.addEventListener('click', openSub);
    subTrigger.addEventListener('mouseleave', (e) => {
      if (!subContent.contains(e.relatedTarget as Node)) closeSub();
    });
    subContent.addEventListener('mouseleave', (e) => {
      if (!subTrigger.contains(e.relatedTarget as Node)) closeSub();
    });

    const sep = document.createElement('li');
    sep.setAttribute('role', 'separator');
    sep.className = '-mx-1 my-1 h-px bg-muted';

    menu.append(
      makeItem('Editar',   fn()),
      makeItem('Duplicar', fn()),
      subTrigger,
      sep,
      makeItem('Excluir',  fn()),
    );
    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      closeSub();
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (
        !menu.contains(e.target as Node) &&
        !t.contains(e.target as Node) &&
        !subContent.contains(e.target as Node)
      ) {
        closeMenu();
      }
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger do submenu presente', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Submenu/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── ComShortcuts ─────────────────────────────────────────────────────────────

export const ComShortcuts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Atalhos visuais (ContextMenuShortcut). São decorativos — `aria-hidden="true"`. Para funcionar, implemente os listeners separadamente.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Shortcuts');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    function makeItemWithShortcut(label: string, shortcut: string, onClick?: () => void): HTMLLIElement {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className =
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
      li.setAttribute('tabindex', '-1');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'flex-1';
      labelSpan.textContent = label;

      const sc = document.createElement('span');
      sc.className = 'ml-auto text-xs tracking-widest text-muted-foreground';
      sc.setAttribute('aria-hidden', 'true');
      sc.textContent = shortcut;

      li.append(labelSpan, sc);
      if (onClick) li.addEventListener('click', onClick);
      return li;
    }

    const sep = document.createElement('li');
    sep.setAttribute('role', 'separator');
    sep.className = '-mx-1 my-1 h-px bg-muted';

    menu.append(
      makeItemWithShortcut('Editar',       '⌘E', fn()),
      makeItemWithShortcut('Duplicar',     '⌘D', fn()),
      makeItemWithShortcut('Compartilhar', '⌘S', fn()),
      sep,
      makeItemWithShortcut('Excluir',      '⌫',  fn()),
    );
    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (!menu.contains(e.target as Node) && !t.contains(e.target as Node)) closeMenu();
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger presente', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Shortcuts/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};
