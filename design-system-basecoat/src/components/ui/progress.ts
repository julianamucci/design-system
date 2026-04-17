// ─── Progress ────────────────────────────────────────────────────────────────

export interface ProgressOptions {
  /** Current progress value (0 – max). */
  value?: number;
  /** Maximum value (default: 100). */
  max?: number;
  /** Additional CSS classes to append to the root element. */
  className?: string;
}

export function createProgress(options: ProgressOptions = {}): HTMLElement {
  const { value = 0, max = 100, className } = options;

  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;

  const root = document.createElement('div');
  root.setAttribute('role', 'progressbar');
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', String(max));
  root.setAttribute('aria-valuenow', String(clampedValue));
  root.className = 'relative h-2 w-full overflow-hidden rounded-full bg-primary/20';
  if (className) root.classList.add(...className.split(' ').filter(Boolean));

  const indicator = document.createElement('div');
  indicator.className = 'h-full w-full flex-1 bg-primary transition-all';
  indicator.style.transform = `translateX(-${100 - percentage}%)`;

  root.appendChild(indicator);

  return root;
}
