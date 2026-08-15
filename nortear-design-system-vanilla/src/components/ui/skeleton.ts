import { cn } from '@/lib/utils';
// ─── Skeleton — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classe .nds-skeleton (standalone).
//
// A caixa NÃO vem de style inline. `data-shape` e `data-width` seguem a mesma
// convenção de `data-spacing` e `data-size` do resto do sistema e mantêm a
// folha de estilo como única dona das medidas — é o que o docs/shared/styles/
// nds/skeleton.css documenta, e o que faz o esqueleto crescer junto quando a
// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
//
// `aria-hidden` sai marcado de fábrica: o esqueleto é ruído para leitor de
// tela. Quem anuncia o carregamento é a região que o contém, com role="status"
// e aria-busy.

export type SkeletonShape = 'text' | 'heading' | 'avatar' | 'fill';
export type SkeletonWidth = 'full' | '3-4' | '2-3' | '1-2' | '1-3';
export type SkeletonSize = 'sm' | 'lg';

export interface SkeletonOptions {
  /** Classes adicionais (utilitárias .nds-*). */
  className?: string;
  /** Forma do placeholder — decide a caixa que ele desenha. */
  shape?: SkeletonShape;
  /** Fração da largura do container. */
  width?: SkeletonWidth;
  /** Medida do avatar na escada `--size-*`. Só vale com `shape: 'avatar'`. */
  size?: SkeletonSize;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const { className, shape, width, size } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'skeleton';
  el.setAttribute('aria-hidden', 'true');
  el.className = cn('nds-skeleton', className);
  if (shape) el.dataset.shape = shape;
  if (width) el.dataset.width = width;
  if (size) el.dataset.size = size;

  return el;
}
