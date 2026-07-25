// ─── Skeleton ────────────────────────────────────────────────────────────────

export interface SkeletonOptions {
  /** Additional CSS classes to append (e.g. sizing utilities like `h-4 w-[200px]`). */
  className?: string;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.className = 'animate-pulse rounded-md bg-primary/10';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
