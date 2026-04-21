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
  /** Classes Tailwind adicionais concatenadas ao className base. */
  className?: string;
}

function badgeClass(variant: BadgeVariant = 'default'): string {
  // PATCH: bugfix — cada variante do basecoat-css é self-contained (define bg/text completos).
  // Antes aplicávamos "badge badge-outline", o que fazia .badge (bg-primary + text-primary-foreground)
  // vazar para a outline (que só redefine text-foreground), quebrando contraste (axe color-contrast).
  return variant === 'default' ? 'badge' : `badge-${variant}`;
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
