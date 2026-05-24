// ─── Badge ───────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeOptions {
  /** Variante visual nativa do Badge. */
  variant?: BadgeVariant;
  /**
   * Conteúdo do Badge: texto curto, número, ou `HTMLElement` (ex.: ícone SVG +
   * texto). Quando string, é inserido via `textContent` (XSS-safe).
   */
  children?: string | HTMLElement | Array<string | HTMLElement>;
  /** Alias legado para `children: string`. Mantido por compatibilidade. */
  text?: string;
  /** Classes adicionais concatenadas ao className base. */
  className?: string;
}

function badgeClass(variant: BadgeVariant = 'default'): string {
  const base = 'nds-badge';
  const modifier =
    variant === 'default'     ? '' :
    variant === 'secondary'   ? 'nds-badge-secondary' :
    variant === 'destructive' ? 'nds-badge-destructive' :
    variant === 'outline'     ? 'nds-badge-outline' :
                                '';
  return [base, modifier].filter(Boolean).join(' ');
}

export function createBadge(options: BadgeOptions = {}): HTMLElement {
  const { variant = 'default', className, children, text } = options;

  const el = document.createElement('div');
  el.className = badgeClass(variant);
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  // `children` tem precedência. Cai em `text` por compatibilidade.
  const content = children ?? text;
  if (content !== undefined && content !== null) {
    const items = Array.isArray(content) ? content : [content];
    for (const item of items) {
      if (typeof item === 'string') {
        el.appendChild(document.createTextNode(item));
      } else if (item instanceof Node) {
        el.appendChild(item);
      }
    }
  }

  return el;
}
