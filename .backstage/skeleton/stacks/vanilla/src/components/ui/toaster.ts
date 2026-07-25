import { createToaster, createToast, showToast, type ToasterOptions, type ToastOptions } from './toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MountedToaster = {
  toast: (opts: ToastOptions) => void;
  dismiss: (id?: string) => void;
  element: HTMLElement;
};

// ─── mountToaster ─────────────────────────────────────────────────────────────

export function mountToaster(options: ToasterOptions = {}): MountedToaster {
  const toasterEl = createToaster(options);
  document.body.appendChild(toasterEl);

  const show = (opts: ToastOptions): void => {
    showToast({ ...opts, toaster: toasterEl });
  };

  const dismiss = (id?: string): void => {
    if (id) {
      const el = toasterEl.querySelector<HTMLElement>(`#${id}`);
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 200);
      }
    } else {
      // Dismiss all
      Array.from(toasterEl.children).forEach((child) => {
        (child as HTMLElement).style.opacity = '0';
        (child as HTMLElement).style.transform = 'translateY(8px)';
        setTimeout(() => child.remove(), 200);
      });
    }
  };

  return { toast: show, dismiss, element: toasterEl };
}

// Re-export for convenience
export { createToaster, createToast, showToast };
export type { ToasterOptions, ToastOptions };
