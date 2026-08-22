import { cn } from '@/lib/utils';
// ─── Badge ───────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'info'
  | 'outline';

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

/**
 * Tabela em vez de cadeia de ternários: com sete variantes a cadeia vira sete
 * ramos, e o último é sempre inalcançável (o tipo já esgotou os valores), o que
 * obrigava a marcar `v8 ignore` na própria implementação. O mapa não tem ramo
 * nenhum, então não há o que cobrir nem o que ignorar.
 */
const VARIANT_CLASSNAME: Record<BadgeVariant, string> = {
  default: '',
  secondary: 'nds-badge-secondary',
  destructive: 'nds-badge-destructive',
  warning: 'nds-badge-warning',
  success: 'nds-badge-success',
  info: 'nds-badge-info',
  outline: 'nds-badge-outline',
};

function badgeClass(variant: BadgeVariant = 'default'): string {
  return ['nds-badge', VARIANT_CLASSNAME[variant]].filter(Boolean).join(' ');
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
  el.className = cn(badgeClass(variant), className);

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
