// ─── Calendar — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-calendar-* (zero Tailwind/basecoat-css).
// Locale-aware (Intl.DateTimeFormat) para nomes de dia/mês.

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarOptions = {
  value?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  /** BCP 47 locale tag (ex: "pt-BR", "en-US", "es-ES"). Default: "en-US". */
  locale?: string;
  class?: string;
};

// ─── Locale helpers ───────────────────────────────────────────────────────────

/** Derives short weekday initials (2 letters) starting from Sunday. */
function getDayNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Sunday = 2020-01-05 (known Sunday as anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2020, 0, 5 + i);
    return fmt.format(d);
  });
}

/** Derives full month names. */
function getMonthNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, m) => {
    const d = new Date(2020, m, 1);
    return fmt.format(d);
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ─── createCalendar ───────────────────────────────────────────────────────────

export function createCalendar(options: CalendarOptions = {}): HTMLElement {
  const { onSelect, disabled, locale = 'en-US' } = options;

  const dayNames = getDayNames(locale);
  const monthNames = getMonthNames(locale);
  const dayButtonLabelFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const today = new Date();
  let viewYear = options.value ? options.value.getFullYear() : today.getFullYear();
  let viewMonth = options.value ? options.value.getMonth() : today.getMonth();
  let selected: Date | null = options.value ?? null;

  const root = document.createElement('div');
  root.dataset.slot = 'calendar';
  root.className = 'nds-calendar';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  function buildChevron(direction: 'left' | 'right'): SVGSVGElement {
    const SVG_NS = 'http://www.w3.org/2000/svg';
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

  function render(): void {
    root.innerHTML = '';

    // Month navigation
    const nav = document.createElement('div');
    nav.className = 'nds-calendar-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'nds-calendar-nav-button';
    prevBtn.setAttribute('aria-label', 'Go to previous month');
    prevBtn.appendChild(buildChevron('left'));
    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });

    const monthLabel = document.createElement('div');
    monthLabel.className = 'nds-calendar-month-label';
    monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nds-calendar-nav-button';
    nextBtn.setAttribute('aria-label', 'Go to next month');
    nextBtn.appendChild(buildChevron('right'));
    nextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });

    nav.appendChild(prevBtn);
    nav.appendChild(monthLabel);
    nav.appendChild(nextBtn);
    root.appendChild(nav);

    // Grid
    const table = document.createElement('table');
    table.className = 'nds-calendar-grid';
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', `${monthNames[viewMonth]} ${viewYear}`);

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    dayNames.forEach((day) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let dayCount = 1;
    for (let week = 0; week < 6; week++) {
      if (dayCount > daysInMonth) break;
      const row = document.createElement('tr');

      for (let col = 0; col < 7; col++) {
        const td = document.createElement('td');

        if ((week === 0 && col < firstDay) || dayCount > daysInMonth) {
          td.textContent = '';
        } else {
          const date = new Date(viewYear, viewMonth, dayCount);
          const isDisabled = disabled ? disabled(date) : false;
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isTodayDate = isToday(date);

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'nds-calendar-day';
          btn.textContent = String(dayCount);
          btn.setAttribute('aria-label', dayButtonLabelFmt.format(date));
          btn.setAttribute('aria-pressed', String(isSelected));
          if (isSelected) btn.dataset.selected = 'true';
          if (isTodayDate) btn.dataset.today = 'true';
          if (isDisabled) btn.disabled = true;

          if (!isDisabled) {
            btn.addEventListener('click', () => {
              selected = date;
              onSelect?.(date);
              render();
            });
          }

          td.appendChild(btn);
          dayCount++;
        }
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    root.appendChild(table);
  }

  render();
  return root;
}
