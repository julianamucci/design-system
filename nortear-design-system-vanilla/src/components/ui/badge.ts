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
    /* v8 ignore next 2 -- o último ramo é inalcançável: BadgeVariant tem
       exatamente estes quatro valores, e os três anteriores já os esgotam. */
    variant === 'outline'     ? 'nds-badge-outline' :
                                '';
  return [base, modifier].filter(Boolean).join(' ');
}

export function createBadge(options: BadgeOptions = {}): HTMLElement {
  const { variant = 'default', className, children, text } = options;

  // <span> e não <div>: o badge é etiqueta inline, mora dentro de frase, título
  // e célula de tabela — um elemento de bloco ali quebra o fluxo do texto. É o
  // que o próprio CSS documenta e o que as outras três stacks renderizam.
  const el = document.createElement('span');
  // data-slot e data-variant: as outras stacks emitem os dois, e é por eles que
  // story, teste e ferramenta encontram o componente sem depender de classe.
  el.dataset.slot = 'badge';
  el.dataset.variant = variant;
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
