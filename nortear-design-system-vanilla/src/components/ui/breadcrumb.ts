import { ChevronRight, MoreHorizontal } from 'lucide';
import { cn } from '@/lib/utils';
// ─── Breadcrumb — Vanilla factories standalone ──────────────────────────────
//
// Visual: classes .nds-breadcrumb-* (standalone).
//
// A opção de classe é `class`, como nas outras fábricas desta stack.
// `className` — o nome herdado do primitivo React — continua aceito como
// apelido para não quebrar chamador; quando os dois vêm, `class` vence.

export interface BreadcrumbOptions {
  /** Accessible label for the nav landmark (default: "breadcrumb"). */
  label?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbListOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbItemOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbLinkOptions {
  href: string;
  text?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbPageOptions {
  text?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbSeparatorOptions {
  /**
   * Conteúdo do separador. Sem valor, o desenho é o `ChevronRight` — que é o
   * que a anatomia compartilhada documenta e o que o CSS dimensiona
   * (`.nds-breadcrumb-separator > svg`). Passe uma string (`'/'`) ou um
   * elemento para trocar.
   */
  content?: string | HTMLElement;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface BreadcrumbEllipsisOptions {
  /**
   * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas — que é o certo quando um
   * gatilho as envolve e já carrega o próprio nome.
   */
  label?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

type LucideIconNode = [string, Record<string, string>];

/**
 * Monta um ícone do lucide por `createElementNS`.
 *
 * Mesma decisão do `alert.ts`: os nós vêm da lista `[tag, attrs]` do pacote
 * agnóstico `lucide`, e não de um `d` copiado à mão — copiado, ele congela na
 * versão do dia e some do radar quando o pacote muda o desenho. Construir nós é
 * imune a XSS: não há `innerHTML` no caminho.
 */
function criarIconeLucide(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const filho = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
    svg.appendChild(filho);
  }
  return svg;
}

export function createBreadcrumb(options: BreadcrumbOptions = {}): HTMLElement {
  const { label = 'breadcrumb' } = options;
  const classe = options.class ?? options.className;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'breadcrumb';
  nav.setAttribute('aria-label', label);
  nav.className = cn('nds-breadcrumb', classe);

  return nav;
}

export function createBreadcrumbList(options: BreadcrumbListOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const ol = document.createElement('ol');
  ol.dataset.slot = 'breadcrumb-list';
  ol.className = cn('nds-breadcrumb-list', classe);

  return ol;
}

export function createBreadcrumbItem(options: BreadcrumbItemOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-item';
  li.className = cn('nds-breadcrumb-item', classe);

  return li;
}

export function createBreadcrumbLink(options: BreadcrumbLinkOptions): HTMLAnchorElement {
  const { href, text = '' } = options;
  const classe = options.class ?? options.className;

  const a = document.createElement('a');
  a.dataset.slot = 'breadcrumb-link';
  a.href = href;
  a.className = cn('nds-breadcrumb-link', classe);
  if (text) a.textContent = text;

  return a;
}

export function createBreadcrumbPage(options: BreadcrumbPageOptions = {}): HTMLElement {
  const { text = '' } = options;
  const classe = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-page';
  // A anatomia documentada é literal: "último item com aria-current='page'; nunca é
  // link". O role="link" com aria-disabled fazia o leitor de tela anunciar
  // justamente o contrário — "link, desabilitado" — para um texto que nunca foi
  // navegável. Quem marca a página atual é o aria-current, e ele vale em
  // qualquer elemento.
  span.setAttribute('aria-current', 'page');
  span.className = cn('nds-breadcrumb-page', classe);
  if (text) span.textContent = text;

  return span;
}

export function createBreadcrumbSeparator(options: BreadcrumbSeparatorOptions = {}): HTMLElement {
  const { content } = options;
  const classe = options.class ?? options.className;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-separator';
  li.setAttribute('role', 'presentation');
  li.setAttribute('aria-hidden', 'true');
  li.className = cn('nds-breadcrumb-separator', classe);

  // O default era o caractere `›`, e era o único dos cinco. A anatomia
  // compartilhada diz "padrão é ChevronRight", o CSS dimensiona
  // `.nds-breadcrumb-separator > svg` (e nada dimensiona o caractere), e as
  // outras quatro stacks desenham o chevron — então a própria docs page desta
  // stack afirmava uma coisa enquanto a factory produzia outra, e o Chromatic
  // fotografava um separador diferente aqui. `content` continua trocando o
  // desenho para quem quer `/`.
  if (content === undefined) {
    li.appendChild(criarIconeLucide(ChevronRight as unknown as LucideIconNode[]));
  } else if (typeof content === 'string') {
    li.textContent = content;
  } else {
    li.appendChild(content);
  }

  return li;
}

/**
 * Indicador de overflow (MoreHorizontal). Quando algumas trilhas são colapsadas,
 * o consumidor liga um click handler externo pra expandir.
 */
export function createBreadcrumbEllipsis(options: BreadcrumbEllipsisOptions = {}): HTMLElement {
  const { label } = options;
  const classe = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-ellipsis';
  // O texto sr-only morava DENTRO de um aria-hidden: nenhum leitor de tela chegava
  // nele, então o rótulo não existia na prática — e ainda estava em inglês num
  // produto em português. As reticências são decorativas mesmo; quem nomeia o
  // conjunto oculto é o gatilho que as envolve, como na composição com menu.
  if (label) {
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
  } else {
    span.setAttribute('aria-hidden', 'true');
  }
  span.className = cn('nds-breadcrumb-ellipsis', classe);

  span.appendChild(criarIconeLucide(MoreHorizontal as unknown as LucideIconNode[]));

  return span;
}
