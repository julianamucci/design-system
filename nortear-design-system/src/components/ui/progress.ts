// ─── Progress — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-progress + .nds-progress-indicator (zero Tailwind).
// Posição do indicador via CSS custom property `--value` (0–100).

export interface ProgressOptions {
  /** Valor atual (0–max). */
  value?: number;
  /** Valor máximo (default: 100). */
  max?: number;
  className?: string;
}

export function createProgress(options: ProgressOptions = {}): HTMLElement {
  const { value = 0, max = 100, className } = options;

  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;

  const root = document.createElement('div');
  root.dataset.slot = 'progress';
  root.setAttribute('role', 'progressbar');
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', String(max));
  root.setAttribute('aria-valuenow', String(clampedValue));
  root.className = 'nds-progress';
  if (className) root.classList.add(...className.split(' ').filter(Boolean));

  const indicator = document.createElement('div');
  indicator.dataset.slot = 'progress-indicator';
  indicator.className = 'nds-progress-indicator';
  indicator.style.setProperty('--value', String(percentage));

  root.appendChild(indicator);

  return root;
}
