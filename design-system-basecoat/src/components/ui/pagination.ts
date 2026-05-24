// ─── Pagination — Vanilla factory standalone ────────────────────────────────
//
// Visual: classes .nds-pagination-* (zero Tailwind/basecoat-css).

export type PaginationOptions = {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
  showPrevNext?: boolean;
  class?: string;
};

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
  const { total, current, onPageChange, showPrevNext = true } = options;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'pagination';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Pagination');
  nav.className = 'nds-pagination';
  if (options.class) nav.classList.add(...options.class.split(' ').filter(Boolean));

  const ul = document.createElement('ul');
  ul.className = 'nds-pagination-list';

  function addItem(child: HTMLElement): void {
    const li = document.createElement('li');
    li.appendChild(child);
    ul.appendChild(li);
  }

  function makeLink(label: string | null, page: number, isCurrent = false): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'nds-pagination-link';

    if (isCurrent) {
      a.setAttribute('aria-current', 'page');
    } else if (label) {
      a.setAttribute('aria-label', `Page ${page}`);
    }

    if (label) a.textContent = label;

    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isCurrent) onPageChange(page);
    });
    return a;
  }

  // Prev
  if (showPrevNext) {
    const prevA = document.createElement('a');
    prevA.href = '#';
    prevA.setAttribute('aria-label', 'Go to previous page');
    prevA.className = 'nds-pagination-link nds-pagination-icon';
    if (current <= 1) prevA.setAttribute('aria-disabled', 'true');
    prevA.appendChild(createChevronSvg('left'));
    prevA.addEventListener('click', (e) => {
      e.preventDefault();
      if (current > 1) onPageChange(current - 1);
    });
    addItem(prevA);
  }

  // Pages
  const pages = getPages(total, current);
  for (const page of pages) {
    if (page === 'ellipsis') {
      const span = document.createElement('span');
      span.className = 'nds-pagination-ellipsis';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = '…';
      const li = document.createElement('li');
      li.appendChild(span);
      ul.appendChild(li);
    } else {
      addItem(makeLink(String(page), page, page === current));
    }
  }

  // Next
  if (showPrevNext) {
    const nextA = document.createElement('a');
    nextA.href = '#';
    nextA.setAttribute('aria-label', 'Go to next page');
    nextA.className = 'nds-pagination-link nds-pagination-icon';
    if (current >= total) nextA.setAttribute('aria-disabled', 'true');
    nextA.appendChild(createChevronSvg('right'));
    nextA.addEventListener('click', (e) => {
      e.preventDefault();
      if (current < total) onPageChange(current + 1);
    });
    addItem(nextA);
  }

  nav.appendChild(ul);
  return nav;
}
