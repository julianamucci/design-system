// ─── Toast — Vanilla factory standalone ─────────────────────────────────────
// Visual: classes .nds-toaster / .nds-toast (zero Tailwind/basecoat-css).

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'default' | 'destructive';

export type ToastPosition =
  | 'top-right' | 'top-center' | 'top-left'
  | 'bottom-right' | 'bottom-center' | 'bottom-left';

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
};

export type ToasterOptions = {
  position?: ToastPosition;
  class?: string;
};

const CLOSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

let _globalToaster: HTMLElement | null = null;

// ─── createToaster ────────────────────────────────────────────────────────────

export function createToaster(options: ToasterOptions = {}): HTMLElement {
  const { position = 'bottom-right' } = options;

  const toaster = document.createElement('div');
  toaster.dataset.slot = 'toaster';
  toaster.dataset.position = position;
  toaster.className = 'nds-toaster';
  if (options.class) toaster.classList.add(...options.class.split(' ').filter(Boolean));
  toaster.setAttribute('role', 'region');
  toaster.setAttribute('aria-label', 'Notifications');
  toaster.setAttribute('aria-live', 'polite');

  return toaster;
}

// ─── createToast ─────────────────────────────────────────────────────────────

export function createToast(options: ToastOptions): HTMLElement {
  const { title, description, variant = 'default', id } = options;

  const toast = document.createElement('div');
  toast.dataset.slot = 'toast';
  if (id) toast.id = id;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');

  toast.className = 'nds-toast';
  toast.dataset.visible = 'false';
  if (variant === 'destructive') {
    toast.dataset.type = 'error';
    toast.setAttribute('data-rich-colors', 'true');
  }

  // Content
  const contentEl = document.createElement('div');
  contentEl.className = 'nds-toast-content';

  const titleEl = document.createElement('div');
  titleEl.className = 'nds-toast-title';
  titleEl.textContent = title;
  contentEl.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'nds-toast-description';
    descEl.textContent = description;
    contentEl.appendChild(descEl);
  }

  toast.appendChild(contentEl);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nds-toast-close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = CLOSE_SVG;
  closeBtn.addEventListener('click', () => dismissToast(toast));
  toast.appendChild(closeBtn);

  return toast;
}

// ─── dismissToast ─────────────────────────────────────────────────────────────

function dismissToast(toast: HTMLElement): void {
  toast.dataset.visible = 'false';
  setTimeout(() => toast.remove(), 200);
}

// ─── showToast ────────────────────────────────────────────────────────────────

export function showToast(options: ToastOptions & { toaster?: HTMLElement }): void {
  const toaster = options.toaster ?? _globalToaster ?? ensureGlobalToaster();
  const toast = createToast(options);
  const duration = options.duration ?? 4000;

  toaster.appendChild(toast);

  requestAnimationFrame(() => {
    toast.dataset.visible = 'true';
  });

  setTimeout(() => dismissToast(toast), duration);
}

function ensureGlobalToaster(): HTMLElement {
  if (!_globalToaster || !document.body.contains(_globalToaster)) {
    _globalToaster = createToaster({ position: 'bottom-right' });
    document.body.appendChild(_globalToaster);
  }
  return _globalToaster;
}
