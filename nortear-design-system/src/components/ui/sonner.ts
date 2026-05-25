// Re-exports and wrappers around the toast-utils vanilla toast implementation.
// Provides a Sonner-compatible API surface for stories and demos.

export type { ToastType, ToastPosition, ToastOptions } from './toast-utils';
export { toast, injectToastStyles } from './toast-utils';

import { injectToastStyles as _injectToastStyles } from './toast-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SonnerToasterOptions = {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  class?: string;
};

// ─── createSonnerToaster ──────────────────────────────────────────────────────

export function createSonnerToaster(options: SonnerToasterOptions = {}): HTMLElement {
  _injectToastStyles();

  const {
    position = 'bottom-right',
    richColors = false,
    expand = false,
    duration = 4000,
  } = options;

  const toaster = document.createElement('div');
  toaster.dataset.slot = 'sonner-toaster';
  toaster.setAttribute('data-sonner-toaster', '');
  toaster.dataset.position = position;
  toaster.setAttribute('data-rich-colors', String(richColors));
  toaster.setAttribute('data-expand', String(expand));
  toaster.setAttribute('data-duration', String(duration));
  toaster.className = 'nds-toaster';

  return toaster;
}
