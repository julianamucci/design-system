import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaginationOptions = {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
  showPrevNext?: boolean;
  class?: string;
};

// ─── SVGs ─────────────────────────────────────────────────────────────────────

const CHEVRON_LEFT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

const CHEVRON_RIGHT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

const LINK_BASE =
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ' +
  'hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2';

const ICON_LINK_BASE =
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ' +
  'hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── createPagination ─────────────────────────────────────────────────────────

export function createPagination(options: PaginationOptions): HTMLElement {
  const { total, current, onPageChange, showPrevNext = true } = options;

  const nav = document.createElement('nav');
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Pagination');
  nav.className = cn('mx-auto flex w-full justify-center', options.class);

  const ul = document.createElement('ul');
  ul.className = 'flex flex-row items-center gap-1';

  function addItem(child: HTMLElement): void {
    const li = document.createElement('li');
    li.className = 'list-none';
    li.appendChild(child);
    ul.appendChild(li);
  }

  function makeLink(label: string | null, html: string | null, page: number, isCurrent = false): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = '#';

    if (isCurrent) {
      a.className = cn(LINK_BASE, 'pointer-events-none');
      a.setAttribute('aria-current', 'page');
    } else {
      a.className = LINK_BASE;
    }

    if (html) {
      a.innerHTML = html;
    } else if (label) {
      a.textContent = label;
    }
    if (label && !isCurrent) a.setAttribute('aria-label', `Page ${page}`);

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
    prevA.className = current <= 1 ? cn(ICON_LINK_BASE, 'pointer-events-none opacity-50') : ICON_LINK_BASE;
    prevA.innerHTML = CHEVRON_LEFT_SVG;
    prevA.addEventListener('click', (e) => {
      e.preventDefault();
      if (current > 1) onPageChange(current - 1);
    });
    addItem(prevA);
  }

  // Pages
  const pages = getPages(total, current);
  let ellipsisCount = 0;

  for (const page of pages) {
    if (page === 'ellipsis') {
      const span = document.createElement('span');
      span.className = 'flex h-9 w-9 items-center justify-center text-sm';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = '…';
      const li = document.createElement('li');
      li.className = 'list-none';
      li.setAttribute('key', `ellipsis-${ellipsisCount++}`);
      li.appendChild(span);
      ul.appendChild(li);
    } else {
      addItem(makeLink(String(page), null, page, page === current));
    }
  }

  // Next
  if (showPrevNext) {
    const nextA = document.createElement('a');
    nextA.href = '#';
    nextA.setAttribute('aria-label', 'Go to next page');
    nextA.className = current >= total ? cn(ICON_LINK_BASE, 'pointer-events-none opacity-50') : ICON_LINK_BASE;
    nextA.innerHTML = CHEVRON_RIGHT_SVG;
    nextA.addEventListener('click', (e) => {
      e.preventDefault();
      if (current < total) onPageChange(current + 1);
    });
    addItem(nextA);
  }

  nav.appendChild(ul);
  return nav;
}
