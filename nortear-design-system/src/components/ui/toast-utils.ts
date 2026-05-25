// Minimal vanilla toast utility for Basecoat (no framework dependency).
// Provides a Sonner-compatible API surface for stories and demos.

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  closeButton?: boolean;
  richColors?: boolean;
  position?: ToastPosition;
}

interface ToastEntry {
  id: number;
  el: HTMLElement;
  timer?: ReturnType<typeof setTimeout>;
}

let toastId = 0;
const activeToasts: ToastEntry[] = [];
let containerEl: HTMLElement | null = null;
let currentPosition: ToastPosition = 'bottom-right';

const ICONS: Record<ToastType, string> = {
  default: '',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

function ensureContainer(position: ToastPosition): HTMLElement {
  if (containerEl && currentPosition === position) return containerEl;

  if (containerEl) containerEl.remove();

  const el = document.createElement('div');
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Notifications');
  el.setAttribute('data-sonner-toaster', '');
  el.className = 'nds-toaster';
  el.dataset.position = position;
  document.body.appendChild(el);
  containerEl = el;
  currentPosition = position;
  return el;
}

function removeToast(id: number) {
  const idx = activeToasts.findIndex(t => t.id === id);
  if (idx === -1) return;
  const entry = activeToasts[idx];
  if (entry.timer) clearTimeout(entry.timer);
  entry.el.dataset.visible = 'false';
  setTimeout(() => {
    entry.el.remove();
    activeToasts.splice(idx, 1);
    if (activeToasts.length === 0 && containerEl) {
      containerEl.remove();
      containerEl = null;
    }
  }, 200);
}

function createToast(type: ToastType, message: string, opts: ToastOptions = {}): number {
  const id = ++toastId;
  const position = opts.position ?? 'bottom-right';
  const container = ensureContainer(position);
  const richColors = opts.richColors ?? false;
  const duration = opts.duration ?? (type === 'error' ? 8000 : 4000);

  const toast = document.createElement('div');
  toast.setAttribute('data-sonner-toast', '');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.className = 'nds-toast';
  toast.dataset.type = type;
  toast.dataset.richColors = String(richColors);
  toast.dataset.visible = 'false';

  if (ICONS[type]) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-toast-icon';
    if (type === 'loading') iconWrap.classList.add('nds-toast-icon-spin');
    iconWrap.innerHTML = ICONS[type];
    toast.appendChild(iconWrap);
  }

  const content = document.createElement('div');
  content.className = 'nds-toast-content';

  const title = document.createElement('p');
  title.className = 'nds-toast-title';
  title.textContent = message;
  content.appendChild(title);

  if (opts.description) {
    const desc = document.createElement('p');
    desc.className = 'nds-toast-description';
    desc.textContent = opts.description;
    content.appendChild(desc);
  }

  if (opts.action) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-toast-action';
    actionBtn.textContent = opts.action.label;
    actionBtn.addEventListener('click', () => {
      opts.action!.onClick();
      removeToast(id);
    });
    content.appendChild(actionBtn);
  }

  toast.appendChild(content);

  if (opts.closeButton) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('data-close-button', '');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.className = 'nds-toast-close';
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    closeBtn.addEventListener('click', () => removeToast(id));
    toast.appendChild(closeBtn);
  }

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.dataset.visible = 'true';
  });

  const entry: ToastEntry = { id, el: toast };
  if (type !== 'loading') {
    entry.timer = setTimeout(() => removeToast(id), duration);
  }
  activeToasts.push(entry);

  return id;
}

export const toast = Object.assign(
  (message: string, opts?: ToastOptions) => createToast('default', message, opts),
  {
    success: (message: string, opts?: ToastOptions) => createToast('success', message, opts),
    error: (message: string, opts?: ToastOptions) => createToast('error', message, opts),
    warning: (message: string, opts?: ToastOptions) => createToast('warning', message, opts),
    info: (message: string, opts?: ToastOptions) => createToast('info', message, opts),
    loading: (message: string, opts?: ToastOptions) => createToast('loading', message, opts),
    dismiss: () => {
      [...activeToasts].forEach(entry => removeToast(entry.id));
    },
    promise: <T>(
      promise: Promise<T>,
      msgs: { loading: string; success: string; error: string },
      opts?: ToastOptions,
    ) => {
      const id = createToast('loading', msgs.loading, { ...opts, duration: 999999 });
      promise
        .then(() => {
          removeToast(id);
          createToast('success', msgs.success, opts);
        })
        .catch(() => {
          removeToast(id);
          createToast('error', msgs.error, opts);
        });
    },
  },
);

/**
 * No-op kept for API compatibility with React/Vue/Svelte stacks.
 * Estilos do toast vivem em `styles/components/toast.css` (sem injeção dinâmica).
 */
export function injectToastStyles(): void {
  // intentionally empty — CSS é importado pelo globals.css
}
