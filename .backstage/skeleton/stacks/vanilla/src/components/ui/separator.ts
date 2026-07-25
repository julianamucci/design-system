// ─── Separator ───────────────────────────────────────────────────────────────

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorOptions {
  orientation?: SeparatorOrientation;
  /** When true the separator is purely visual and hidden from assistive tech. */
  decorative?: boolean;
  /** Additional CSS classes to append. */
  className?: string;
}

export function createSeparator(options: SeparatorOptions = {}): HTMLElement {
  const { orientation = 'horizontal', decorative = true, className } = options;

  const el = document.createElement('div');

  if (decorative) {
    el.setAttribute('role', 'none');
    el.setAttribute('aria-hidden', 'true');
  } else {
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', orientation);
  }

  if (orientation === 'horizontal') {
    el.className = 'shrink-0 bg-border h-[1px] w-full';
  } else {
    el.className = 'shrink-0 bg-border h-full w-[1px]';
  }

  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
