// ─── Pagination — Vanilla factory standalone ────────────────────────────────
//
// Visual: classes .nds-pagination-* (standalone).

import { cn } from '@/lib/utils';

export type PaginationOptions = {
  total: number;
  current: number;
  /**
   * Avisado quando outra página é pedida.
   *
   * Continua sendo chamado com `hrefForPage`: é por ele que passam a analítica
   * e o estado da tela. Opcional porque uma paginação inteiramente de rota não
   * precisa de mais nada além dos endereços.
   */
  onPageChange?: (page: number) => void;
  /**
   * Endereço real de cada página.
   *
   * Sem ele todo link nasce `href="#"` e o clique é anulado — o que serve à
   * paginação que vive só na memória, e deixa de servir no dia em que a página
   * precisa ser compartilhável, indexável ou aberta em nova aba. Com ele o link
   * é um destino de verdade e o clique SEGUE: quem usa roteador de cliente o
   * intercepta como faria com qualquer link da página.
   *
   *     createPagination({ …, hrefForPage: (p) => `?page=${p}` })
   */
  hrefForPage?: (page: number) => string;
  showPrevNext?: boolean;
  /** Nome acessível do landmark. Padrão: `Paginação`. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /**
   * Alinhamento da faixa. Sem valor, ela ocupa a linha inteira e fica centrada;
   * `start`/`end` a encolhem e a encostam na ponta — o caso do rodapé de tabela.
   */
  align?: 'start' | 'end';
  class?: string;
};

/** Rótulos em português — o idioma da documentação que cerca o componente. */
const LABELS = {
  navigation: 'Paginação',
  previous: 'Ir para a página anterior',
  next: 'Ir para a próxima página',
  page: (n: number) => `Ir para página ${n}`,
} as const;

// ─── SVGs ──────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function createChevronSvg(direction: 'left' | 'right'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6');
  svg.appendChild(path);
  return svg;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getPages(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

// ─── createPagination ──────────────────────────────────────────────────────

export function createPagination(options: PaginationOptions): HTMLElement {
  const { total, current, onPageChange, hrefForPage, showPrevNext = true, align } = options;
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const landmarkName = options['aria-label'] ?? options.label ?? LABELS.navigation;

  /**
   * Endereço do link e o que fazer com o clique.
   *
   * `#` só existe quando não há rota: é âncora vazia, e deixá-la seguir levaria
   * a rolagem ao topo sem trocar página nenhuma. Com rota, anular o clique
   * seria pior — apagaria o "abrir em nova aba" e o roteador de cliente junto.
   */
  function pageEndereco(page: number): string {
    return hrefForPage ? hrefForPage(page) : '#';
  }

  const nav = document.createElement('nav');
  nav.dataset.slot = 'pagination';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', landmarkName);
  if (align) nav.dataset.align = align;
  nav.className = cn('nds-pagination', options.class);

  const ul = document.createElement('ul');
  ul.dataset.slot = 'pagination-content';
  ul.className = 'nds-pagination-list';

  function addItem(child: HTMLElement): void {
    const li = document.createElement('li');
    li.dataset.slot = 'pagination-item';
    li.appendChild(child);
    ul.appendChild(li);
  }

  function makeLink(page: number, isCurrent: boolean): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = pageEndereco(page);
    a.dataset.slot = 'pagination-link';
    a.className = 'nds-pagination-link';

    // Todo link numerado tem rótulo com contexto — inclusive o da página atual:
    // "3" sozinho não diz nada em voz alta. Quem anuncia que é a página atual é
    // o `aria-current`, nativamente e em qualquer idioma.
    a.setAttribute('aria-label', LABELS.page(page));
    if (isCurrent) {
      a.setAttribute('aria-current', 'page');
      a.dataset.active = 'true';
    }

    a.textContent = String(page);

    a.addEventListener('click', (e) => {
      if (!hrefForPage) e.preventDefault();
      if (!isCurrent) onPageChange?.(page);
    });
    return a;
  }

  /**
   * Controle direcional.
   *
   * Desabilitado é `aria-disabled` MAIS `tabindex="-1"`: em `<a>` não existe
   * `disabled`, o CSS já barra o ponteiro a partir do `aria-disabled`, e sem o
   * tabindex negativo o controle inerte continuava na ordem de tabulação.
   */
  function makeDirecional(
    direction: 'left' | 'right',
    label: string,
    slot: string,
    disabled: boolean,
    destination: number,
    onClick: () => void,
  ): HTMLAnchorElement {
    const a = document.createElement('a');
    // Nos extremos o controle não leva a lugar nenhum: `#` ali é honesto, e um
    // endereço válido convidaria a abrir em nova aba uma página que não existe.
    a.href = disabled ? '#' : pageEndereco(destination);
    a.dataset.slot = slot;
    a.setAttribute('aria-label', label);
    a.className = 'nds-pagination-link nds-pagination-icon';
    if (disabled) {
      a.setAttribute('aria-disabled', 'true');
      a.tabIndex = -1;
    }
    a.appendChild(createChevronSvg(direction));
    a.addEventListener('click', (e) => {
      if (!hrefForPage || disabled) e.preventDefault();
      if (!disabled) onClick();
    });
    return a;
  }

  // Prev
  if (showPrevNext) {
    addItem(
      makeDirecional('left', LABELS.previous, 'pagination-previous', current <= 1, current - 1, () =>
        onPageChange?.(current - 1),
      ),
    );
  }

  // Pages
  const pages = getPages(total, current);
  for (const page of pages) {
    if (page === 'ellipsis') {
      const span = document.createElement('span');
      span.dataset.slot = 'pagination-ellipsis';
      span.className = 'nds-pagination-ellipsis';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = '…';
      const li = document.createElement('li');
      li.dataset.slot = 'pagination-item';
      li.appendChild(span);
      ul.appendChild(li);
    } else {
      addItem(makeLink(page, page === current));
    }
  }

  // Next
  if (showPrevNext) {
    addItem(
      makeDirecional('right', LABELS.next, 'pagination-next', current >= total, current + 1, () =>
        onPageChange?.(current + 1),
      ),
    );
  }

  nav.appendChild(ul);
  return nav;
}
