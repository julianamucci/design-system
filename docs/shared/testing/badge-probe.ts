/**
 * Sonda do Badge — a mesma medição nas cinco stacks.
 *
 * Existe porque cada stack media o contrato do seu jeito, e a medição desigual
 * deixava contrato de pé numa stack e sem portão na outra. Medido em 2026-09-14,
 * na Fase B da passagem de fix:
 *
 *  - o vue não comparava a borda com o token esperado, então C4 e C5 (a `info`
 *    lê `--border`, não `--info`) não eram medidos lá;
 *  - o piso de 3:1 da borda (D3) só existia no svelte;
 *  - o angular media outro trio de "distinguíveis" que o conteúdo publica;
 *  - react, vue e svelte montavam a referência com `nds-badge-default` escrito à
 *    mão — classe que a referência (vanilla) não emite.
 *
 * Tudo aqui mede o que está NA TELA (cor computada, caixa desenhada), nunca a
 * classe. As funções que resolvem token montam um elemento-sonda e o retiram:
 * NUNCA chame dentro de `waitFor` (ver a regra do `waitFor` que pendura).
 */

import { backgroundEffective, ratio, resolveColor, ruleDeclaration } from './cor';

export type BadgeVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

/**
 * O token que pinta a BORDA de cada variante (D1, D6). A `info` lê a hairline
 * neutra — a simetria de nomes é a armadilha, e é ela que esta tabela reprova.
 */
export const BADGE_BORDER_TOKEN: Record<BadgeVariant, string> = {
  default: '--primary',
  destructive: '--destructive',
  warning: '--warning',
  success: '--success',
  info: '--border',
};

/** Piso de 3:1 da borda contra a página (WCAG 1.4.11). A `info` fica fora, por decisão (D3). */
export const BADGE_BORDER_FLOOR = 3;

/** A etiqueta pelo `data-slot`, considerando o próprio nó. */
export function badgeRoot(root: ParentNode): HTMLElement {
  if (root instanceof HTMLElement && root.matches('[data-slot="badge"]')) return root;
  const el = root.querySelector<HTMLElement>('[data-slot="badge"]');
  if (!el) throw new Error('SONDA::badge: nenhum [data-slot="badge"] no canvas');
  return el;
}

/** A variante que a etiqueta DECLARA no DOM (as cinco emitem `data-variant`). */
export function badgeVariant(el: HTMLElement): BadgeVariant | null {
  return (el.getAttribute('data-variant') as BadgeVariant | null) ?? null;
}

export interface BadgeBorder {
  width: number;
  color: string;
  expected: string | null;
}

/** Largura e cor da borda desenhada, e a cor que o token da variante produz ali. */
export function badgeBorder(el: HTMLElement, variant: BadgeVariant): BadgeBorder {
  const cs = getComputedStyle(el);
  return {
    width: Number.parseFloat(cs.borderTopWidth) || 0,
    color: cs.borderTopColor,
    expected: resolveColor(el, `hsl(var(${BADGE_BORDER_TOKEN[variant]}))`),
  };
}

/** Razão da borda contra o que está atrás da etiqueta (D3). */
export function borderAgainstPage(el: HTMLElement): number {
  const page = backgroundEffective(el.parentElement) ?? 'rgb(255, 255, 255)';
  return ratio(getComputedStyle(el).borderTopColor, page)?.ratio ?? 0;
}

export interface BadgeSurface {
  background: string;
  color: string;
  expectedBackground: string | null;
  expectedColor: string | null;
  textRatio: number;
}

/**
 * Fundo e texto da etiqueta contra `--background`/`--foreground` (D1, C2) e o
 * contraste do texto (C8) — que não pode depender da variante.
 */
export function badgeSurface(el: HTMLElement): BadgeSurface {
  const cs = getComputedStyle(el);
  const background = backgroundEffective(el) ?? cs.backgroundColor;
  return {
    background: cs.backgroundColor,
    color: cs.color,
    expectedBackground: resolveColor(el, 'hsl(var(--background))'),
    expectedColor: resolveColor(el, 'hsl(var(--foreground))'),
    textRatio: ratio(cs.color, background)?.ratio ?? 0,
  };
}

export interface BadgeCounterMeasure {
  background: string;
  expectedBackground: string | null;
  textRatio: number;
  /** O contador começa depois do fim do rótulo. */
  rightOfLabel: boolean;
  /** Rótulo e contador se sobrepõem na vertical: estão na mesma linha. */
  sameLine: boolean;
}

/**
 * O contador contra o rótulo que o precede (C11, C12, D5). A caixa do rótulo sai
 * de um `Range` sobre os nós de texto da etiqueta que vêm ANTES do contador —
 * o rótulo não é elemento, é texto.
 */
export function badgeCounterMeasure(badge: HTMLElement): BadgeCounterMeasure {
  const counter = badge.querySelector<HTMLElement>('[data-slot="badge-counter"]');
  if (!counter) throw new Error('SONDA::badge: nenhum [data-slot="badge-counter"] na etiqueta');
  const cs = getComputedStyle(counter);
  const counterBox = counter.getBoundingClientRect();

  const textNodes = Array.from(badge.childNodes).filter(
    (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
  );
  let rightOfLabel = false;
  let sameLine = false;
  if (textNodes.length > 0) {
    const range = badge.ownerDocument.createRange();
    range.setStartBefore(textNodes[0]);
    range.setEndAfter(textNodes[textNodes.length - 1]);
    const labelBox = range.getBoundingClientRect();
    rightOfLabel = counterBox.left >= labelBox.right - 0.5;
    sameLine = counterBox.top < labelBox.bottom && counterBox.bottom > labelBox.top;
  }

  return {
    background: cs.backgroundColor,
    expectedBackground: resolveColor(counter, 'hsl(var(--secondary))'),
    textRatio: ratio(cs.color, cs.backgroundColor)?.ratio ?? 0,
    rightOfLabel,
    sameLine,
  };
}

export interface BadgeLinkHover {
  /** A etiqueta é filha DIRETA de `<a>` — é o que o seletor da folha casa. */
  insideLink: boolean;
  /** O fundo que a regra `a > .nds-badge:hover` declara, como está na folha. */
  declared: string | null;
  /** Esse fundo resolvido em rgb no contexto da etiqueta. */
  resolved: string | null;
  /** O que `--secondary` produz ali. */
  expected: string | null;
}

/**
 * O hover dentro de link (C17), pela DECLARAÇÃO da folha.
 *
 * `:hover` não acende por evento sintético: o `userEvent` das plays despacha
 * eventos, e o navegador só aplica a pseudo-classe com ponteiro real. Medido em
 * 2026-09-14 na `AsLink` do angular — depois do `hover`, o fundo continuou
 * `rgb(255, 253, 252)` contra os `rgb(243, 240, 236)` esperados. É a mesma saída
 * que o `input-probe` já usa: confere a estrutura que o seletor exige e o valor
 * que a regra declara, em vez de esperar um estado que o teste não produz.
 */
export function badgeLinkHover(badge: HTMLElement): BadgeLinkHover {
  const declared = ruleDeclaration(
    badge.ownerDocument,
    (selector) => /(^|,)\s*a\s*>\s*\.nds-badge:hover\s*(,|$)/.test(selector),
    'background-color',
  );
  return {
    insideLink: badge.parentElement?.tagName === 'A',
    declared,
    resolved: declared ? resolveColor(badge, declared) : null,
    expected: resolveColor(badge, 'hsl(var(--secondary))'),
  };
}

/** `data-icon="inline-start"` encurta o padding do lado do ícone (C10). */
export function iconPadding(badge: HTMLElement): { start: number; end: number } {
  const cs = getComputedStyle(badge);
  return {
    start: Number.parseFloat(cs.paddingInlineStart) || 0,
    end: Number.parseFloat(cs.paddingInlineEnd) || 0,
  };
}
