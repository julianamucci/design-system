import { cn } from '@/lib/utils';
// ─── Aspect Ratio — Vanilla factory standalone ───────────────────────────────
//
// Visual: classes .nds-aspect-ratio (standalone-css).
// Usa `aspect-ratio` CSS nativo via CSS custom property `--ratio`.

export interface AspectRatioOptions {
  /** Proporção (width / height). Ex.: 16/9, 4/3, 1. Default: 1 (quadrado). */
  ratio?: number;
  /** Filho opcional. */
  content?: HTMLElement;
  /** Classes adicionais. */
  className?: string;
}

export function createAspectRatio(options: AspectRatioOptions = {}): HTMLElement {
  const { ratio = 1, content, className } = options;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'aspect-ratio';
  wrapper.className = cn('nds-aspect-ratio', className);
  wrapper.style.setProperty('--ratio', String(ratio));

  if (content) wrapper.appendChild(content);

  return wrapper;
}
