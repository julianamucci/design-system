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

// ─── Contador ────────────────────────────────────────────────────────────────

export interface BadgeCounterOptions {
  /**
   * Número exibido, já formatado. Acima de 99 a orientação é mostrar `'99+'` —
   * o truncamento é da aplicação, e por isso o valor entra como texto e não
   * como número: a peça não formata nada.
   */
  text?: string;
  /** Classes adicionais concatenadas ao className base. */
  className?: string;
}

/**
 * Contador da etiqueta — o número à direita do texto, DENTRO do badge.
 *
 * Escolha de forma: SUBFÁBRICA (`createBadgeCounter`), e não uma opção `count`
 * de `createBadge`. É a mesma forma que `createAlertTitle` e `createCardTitle`
 * já usam para subpeça nesta stack: fábrica própria, `data-slot` explícito,
 * `cn()` com a classe base. Três razões medidas contra o que a folha define:
 *
 * 1. O conteúdo não é só número — `'99+'` é a orientação da própria
 *    documentação, e opção numérica obrigaria a fábrica a formatar.
 * 2. A peça não é variante: QUALQUER variante a aceita. Como opção, cada
 *    combinação teria de existir na assinatura; como filho, a composição fica
 *    onde ela é lida — o elemento devolvido entra no `children` do badge, que
 *    já aceita lista de texto e elemento.
 * 3. `createBadge` não ganha ramo novo: a fábrica segue sem condicional de
 *    conteúdo, e o contador é montado por quem compõe.
 *
 * Ele é NEUTRO por decisão de contraste (fundo `--secondary`, texto
 * `--foreground`), em qualquer variante: a cor fica na borda da etiqueta, ao
 * redor. Pintá-lo com a cor da variante derruba o número abaixo de 4.5:1 em
 * parte dos temas.
 */
export function createBadgeCounter(options: BadgeCounterOptions = {}): HTMLElement {
  const { text = '', className } = options;

  // <span>, como o próprio badge: a peça mora dentro da etiqueta, que é
  // inline-flex — um elemento de bloco ali quebraria a linha do rótulo.
  const el = document.createElement('span');
  el.dataset.slot = 'badge-counter';
  el.className = cn('nds-badge-counter', className);
  // `textContent` e não innerHTML: o número é dado da aplicação (XSS-safe).
  // Sem `if`: com o default `''` a atribuição já é inócua, e o ramo existiria
  // só para ser marcado `v8 ignore` — foi o que aconteceu nas outras subpeças.
  el.textContent = text;

  return el;
}
