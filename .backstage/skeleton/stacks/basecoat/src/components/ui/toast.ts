import { cn } from '@/lib/utils';

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

// ─── Position classes ─────────────────────────────────────────────────────────

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-right':    'top-4 right-4',
  'top-center':   'top-4 left-1/2 -translate-x-1/2',
  'top-left':     'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center':'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-left':  'bottom-4 left-4',
};

const CLOSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

let _globalToaster: HTMLElement | null = null;

// ─── createToaster ────────────────────────────────────────────────────────────

export function createToaster(options: ToasterOptions = {}): HTMLElement {
  const { position = 'bottom-right' } = options;

  const toaster = document.createElement('div');
  toaster.dataset.slot = 'toaster';
  toaster.className = cn(
    'toaster fixed z-[9999] flex flex-col gap-2 pointer-events-none',
    POSITION_CLASSES[position],
    options.class
  );
  toaster.style.maxWidth = '420px';
  toaster.style.width = '100%';
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

  toast.className = cn(
    'toast pointer-events-auto w-full flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-200',
    variant === 'destructive'
      ? 'destructive border-destructive bg-destructive text-destructive-foreground'
      : 'bg-background text-foreground border-border'
  );

  // Content
  const contentEl = document.createElement('div');
  contentEl.className = 'toast-content flex-1 min-w-0';

  const titleEl = document.createElement('div');
  titleEl.className = 'text-sm font-semibold';
  titleEl.textContent = title;
  contentEl.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'text-sm opacity-90 mt-1';
    descEl.textContent = description;
    contentEl.appendChild(descEl);
  }

  toast.appendChild(contentEl);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = CLOSE_SVG;
  closeBtn.addEventListener('click', () => dismissToast(toast));
  toast.appendChild(closeBtn);

  return toast;
}

// ─── dismissToast ─────────────────────────────────────────────────────────────

function dismissToast(toast: HTMLElement): void {
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px)';
  setTimeout(() => toast.remove(), 200);
}

// ─── showToast ────────────────────────────────────────────────────────────────

export function showToast(options: ToastOptions & { toaster?: HTMLElement }): void {
  const toaster = options.toaster ?? _globalToaster ?? ensureGlobalToaster();
  const toast = createToast(options);
  const duration = options.duration ?? 4000;

  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px)';
  toaster.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
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
