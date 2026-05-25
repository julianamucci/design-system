// ─── Separator — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-separator (zero Tailwind/basecoat-css).
// Decorativo por default (role="none"); use decorative:false para semântico.

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorOptions {
  orientation?: SeparatorOrientation;
  /** When true the separator is purely visual and hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
}

export function createSeparator(options: SeparatorOptions = {}): HTMLElement {
  const { orientation = 'horizontal', decorative = true, className } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'separator';
  el.dataset.orientation = orientation;
  el.className = 'nds-separator';

  if (decorative) {
    el.setAttribute('role', 'none');
    el.setAttribute('aria-hidden', 'true');
  } else {
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', orientation);
  }

  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
