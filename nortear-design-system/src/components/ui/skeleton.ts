// ─── Skeleton — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classe .nds-skeleton (zero Tailwind/basecoat-css).
// Sem dimensão padrão — o consumidor define width/height via style ou className.

export interface SkeletonOptions {
  /** Classes adicionais (ex: utilitárias para sizing). */
  className?: string;
  /** Altura inline conveniente (ex: "1rem" ou "16px"). */
  height?: string;
  /** Largura inline conveniente. */
  width?: string;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const { className, height, width } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'skeleton';
  el.setAttribute('aria-hidden', 'true');
  el.className = 'nds-skeleton';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (height) el.style.height = height;
  if (width) el.style.width = width;

  return el;
}
