// ─── Badge ───────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeOptions {
  /** Text content displayed inside the badge. */
  text?: string;
  variant?: BadgeVariant;
  /** Additional CSS classes to append. */
  className?: string;
}

function badgeClass(variant: BadgeVariant = 'default'): string {
  return variant === 'default' ? 'badge' : `badge badge-${variant}`;
}

export function createBadge(options: BadgeOptions = {}): HTMLElement {
  const { text = '', variant = 'default', className } = options;

  const el = document.createElement('div');
  el.className = badgeClass(variant);
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}
