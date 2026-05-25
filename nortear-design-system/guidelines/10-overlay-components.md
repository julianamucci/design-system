# Overlay Components (Basecoat — Vanilla TypeScript)

---

## Regras Globais de Overlay

### Tokens de fundo por tipo

| Tipo de overlay | Token correto | Uso |
|-----------------|---------------|-----|
| Painel de conteúdo (modal, lateral) | `bg-card text-card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `bg-popover text-popover-foreground` | Dropdown, Popover, Tooltip |

### Comportamento de teclado — implementar manualmente

Em Vanilla TS, os comportamentos de teclado devem ser implementados explicitamente:

```ts
// Fechar com Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeActiveOverlay();
});

// Focus trap dentro de Dialog
function trapFocus(container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
```

---

## Dialog

**Propósito**: modal para formulários, edição ou confirmações.

**Implementação**:
```ts
export interface DialogOptions {
  title: string;
  description: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onClose?: () => void;
}

export function createDialog({ title, description, content, footer, onClose }: DialogOptions): {
  dialog: HTMLElement;
  open: () => void;
  close: () => void;
} {
  const titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;
  const descId = `dialog-desc-${Math.random().toString(36).slice(2)}`;

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 z-50 bg-black/80 hidden';
  backdrop.setAttribute('aria-hidden', 'true');

  // Dialog
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', descId);
  dialog.className = cn(
    'fixed left-[50%] top-[50%] z-50 hidden',
    'translate-x-[-50%] translate-y-[-50%]',
    'w-full max-w-lg rounded-lg border border-border',
    'bg-card text-card-foreground shadow-lg p-6'
  );

  const titleEl = document.createElement('h2');
  titleEl.id = titleId;
  titleEl.className = 'text-lg font-semibold leading-none tracking-tight';
  titleEl.textContent = title;

  const descEl = document.createElement('p');
  descEl.id = descId;
  descEl.className = 'text-sm text-muted-foreground mt-1.5';
  descEl.textContent = description;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = cn(
    'absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  );
  closeBtn.setAttribute('aria-label', 'Fechar dialog');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', close);

  dialog.append(closeBtn, titleEl, descEl, content);
  if (footer) dialog.appendChild(footer);
  document.body.append(backdrop, dialog);

  function open() {
    backdrop.classList.remove('hidden');
    dialog.classList.remove('hidden');
    trapFocus(dialog);
    closeBtn.focus();
    document.addEventListener('keydown', handleEscape);
  }

  function close() {
    backdrop.classList.add('hidden');
    dialog.classList.add('hidden');
    document.removeEventListener('keydown', handleEscape);
    onClose?.();
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  backdrop.addEventListener('click', close);

  return { dialog, open, close };
}
```

**Obrigatório**: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby`.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):

Adicione chamadas de `track` nas funções `open` e `close`:

```ts
import { track } from '@/lib/analytics';

function open() {
  track('dialog_open', { component: 'dialog', trigger: 'button' });
  // ... lógica existente
}

function close() {
  track('dialog_close', { component: 'dialog' });
  // ... lógica existente
}
```

---

## Dropdown Menu

```ts
export function createDropdownMenu(options: {
  trigger: HTMLElement;
  items: Array<{ label: string; onClick: () => void; destructive?: boolean } | 'separator'>;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative inline-block';
  wrapper.appendChild(options.trigger);

  const menu = document.createElement('div');
  menu.setAttribute('role', 'menu');
  menu.className = cn(
    'absolute right-0 z-50 mt-1 min-w-[8rem] rounded-md border border-border',
    'bg-popover text-popover-foreground shadow-md hidden'
  );

  options.items.forEach((item) => {
    if (item === 'separator') {
      const sep = document.createElement('hr');
      sep.className = '-mx-1 my-1 h-px bg-muted border-none';
      sep.setAttribute('role', 'separator');
      menu.appendChild(sep);
      return;
    }

    const btn = document.createElement('button');
    btn.setAttribute('role', 'menuitem');
    btn.type = 'button';
    btn.className = cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
      'outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
      'focus-visible:ring-2 focus-visible:ring-ring',
      item.destructive && 'text-destructive hover:text-destructive focus:text-destructive'
    );
    btn.textContent = item.label;
    btn.addEventListener('click', () => { item.onClick(); closeMenu(); });
    menu.appendChild(btn);
  });

  options.trigger.setAttribute('aria-haspopup', 'true');
  options.trigger.setAttribute('aria-expanded', 'false');
  options.trigger.addEventListener('click', toggleMenu);

  function toggleMenu() {
    const isOpen = !menu.classList.contains('hidden');
    if (isOpen) closeMenu();
    else openMenu();
  }

  function openMenu() {
    menu.classList.remove('hidden');
    options.trigger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.add('hidden');
    options.trigger.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); options.trigger.focus(); }
  });

  wrapper.appendChild(menu);
  return wrapper;
}
```

---

## Tooltip

```ts
export function createTooltip(trigger: HTMLElement, text: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative inline-block';
  wrapper.appendChild(trigger);

  const tooltip = document.createElement('div');
  tooltip.setAttribute('role', 'tooltip');
  tooltip.className = cn(
    'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden',
    'rounded-md bg-popover text-popover-foreground border border-border px-3 py-1.5 text-xs shadow-md'
  );
  tooltip.textContent = text;

  const tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`;
  tooltip.id = tooltipId;
  trigger.setAttribute('aria-describedby', tooltipId);

  trigger.addEventListener('mouseenter', () => tooltip.classList.remove('hidden'));
  trigger.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
  trigger.addEventListener('focus', () => tooltip.classList.remove('hidden'));
  trigger.addEventListener('blur', () => tooltip.classList.add('hidden'));

  wrapper.appendChild(tooltip);
  return wrapper;
}
```
