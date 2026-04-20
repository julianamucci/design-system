import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarOptions = {
  value?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  class?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CHEVRON_LEFT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const CHEVRON_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

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
  const { onSelect, disabled } = options;

  const today = new Date();
  let viewYear = options.value ? options.value.getFullYear() : today.getFullYear();
  let viewMonth = options.value ? options.value.getMonth() : today.getMonth();
  let selected: Date | null = options.value ?? null;

  const root = document.createElement('div');
  root.dataset.slot = 'calendar';
  root.className = cn('p-3 select-none', options.class);

  function render(): void {
    root.innerHTML = '';

    // Month navigation
    const nav = document.createElement('div');
    nav.className = 'flex pt-1 relative items-center justify-between mb-2';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className =
      'inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background text-sm ' +
      'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
    prevBtn.setAttribute('aria-label', 'Go to previous month');
    prevBtn.innerHTML = CHEVRON_LEFT;
    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });

    const monthLabel = document.createElement('div');
    monthLabel.className = 'text-sm font-medium';
    monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className =
      'inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background text-sm ' +
      'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
    nextBtn.setAttribute('aria-label', 'Go to next month');
    nextBtn.innerHTML = CHEVRON_RIGHT;
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
    table.className = 'w-full border-collapse space-y-1';
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', `${MONTH_NAMES[viewMonth]} ${viewYear}`);

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'flex';
    DAY_NAMES.forEach((day) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.className = 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center';
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
      row.className = 'flex w-full mt-2';

      for (let col = 0; col < 7; col++) {
        const td = document.createElement('td');
        td.className = 'text-center p-0 relative';

        if ((week === 0 && col < firstDay) || dayCount > daysInMonth) {
          td.textContent = '';
        } else {
          const date = new Date(viewYear, viewMonth, dayCount);
          const isDisabled = disabled ? disabled(date) : false;
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isTodayDate = isToday(date);

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = String(dayCount);
          btn.setAttribute('aria-label', date.toLocaleDateString());
          if (isSelected) btn.setAttribute('aria-selected', 'true');
          if (isDisabled) btn.disabled = true;

          btn.className = cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isSelected
              ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              : isTodayDate
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground',
            isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
          );

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
