// ─── Command — Vanilla factory standalone ───────────────────────────────────
// Visual: classes .nds-command-* (zero Tailwind/basecoat-css).

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommandItem = {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
};

export type CommandOptions = {
  placeholder?: string;
  items: CommandItem[];
  onSelect?: (value: string) => void;
  class?: string;
};

// ─── createCommand ────────────────────────────────────────────────────────────

export function createCommand(options: CommandOptions): HTMLElement {
  const { placeholder = 'Search…', items, onSelect } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'command';
  root.className = 'nds-command';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  const _cmdId = `cmd-${Math.random().toString(36).slice(2, 8)}`;
  const _listboxId = `${_cmdId}-listbox`;

  // Search input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'nds-command-input-wrapper';

  // Build SVG via DOM (avoids innerHTML for static content — scanner-safe)
  const svgNS = 'http://www.w3.org/2000/svg';
  const searchIcon = document.createElementNS(svgNS, 'svg');
  searchIcon.setAttribute('xmlns', svgNS);
  searchIcon.setAttribute('width', '16');
  searchIcon.setAttribute('height', '16');
  searchIcon.setAttribute('viewBox', '0 0 24 24');
  searchIcon.setAttribute('fill', 'none');
  searchIcon.setAttribute('stroke', 'currentColor');
  searchIcon.setAttribute('stroke-width', '2');
  searchIcon.setAttribute('stroke-linecap', 'round');
  searchIcon.setAttribute('stroke-linejoin', 'round');
  searchIcon.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '8');
  const line = document.createElementNS(svgNS, 'path');
  line.setAttribute('d', 'm21 21-4.3-4.3');
  searchIcon.append(circle, line);
  inputWrapper.appendChild(searchIcon);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'nds-command-input';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', _listboxId);
  input.setAttribute('aria-label', placeholder || 'Buscar');
  inputWrapper.appendChild(input);
  root.appendChild(inputWrapper);

  // List
  const list = document.createElement('div');
  list.className = 'nds-command-list';
  list.id = _listboxId;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', placeholder || 'Resultados');
  list.setAttribute('tabindex', '0');
  root.appendChild(list);

  let activeIndex = -1;
  let visibleItems: HTMLElement[] = [];

  function groupItems(filtered: CommandItem[]): Map<string, CommandItem[]> {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const key = item.group ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }

  function renderList(query: string): void {
    list.innerHTML = '';
    visibleItems = [];
    activeIndex = -1;

    const q = query.toLowerCase();
    const filtered = items.filter(
      (item) => !q || item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      // listbox vazio violaria aria-required-children — promovemos para region.
      list.setAttribute('role', 'region');
      const empty = document.createElement('p');
      empty.className = 'nds-command-empty';
      empty.textContent = 'No results found.';
      list.appendChild(empty);
      return;
    }
    // Restaura role original caso filtre depois.
    list.setAttribute('role', 'listbox');

    const grouped = groupItems(filtered);

    grouped.forEach((groupItems, groupName) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'nds-command-group';

      if (groupName) {
        const heading = document.createElement('div');
        heading.className = 'nds-command-group-heading';
        heading.textContent = groupName;
        groupEl.appendChild(heading);
      }

      groupItems.forEach((item) => {
        const el = buildItemEl(item);
        groupEl.appendChild(el);
        visibleItems.push(el);
      });

      list.appendChild(groupEl);
    });
  }

  function buildItemEl(item: CommandItem): HTMLElement {
    const el = document.createElement('div');
    el.dataset.slot = 'command-item';
    el.dataset.value = item.value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', 'false');
    el.className = 'nds-command-item';
    if (item.disabled) el.setAttribute('aria-disabled', 'true');
    el.textContent = item.label;

    if (!item.disabled) {
      el.addEventListener('click', () => selectItem(item.value));
      el.addEventListener('mouseenter', () => {
        setActive(visibleItems.indexOf(el));
      });
    }

    return el;
  }

  function setActive(index: number): void {
    visibleItems.forEach((el, i) => {
      if (i === index) {
        el.setAttribute('aria-selected', 'true');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.setAttribute('aria-selected', 'false');
      }
    });
    activeIndex = index;
  }

  function selectItem(value: string): void {
    onSelect?.(value);
    input.value = '';
    renderList('');
  }

  input.addEventListener('input', () => renderList(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, visibleItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const el = visibleItems[activeIndex];
      if (el) selectItem(el.dataset.value!);
    } else if (e.key === 'Escape') {
      input.blur();
    }
  });

  renderList('');
  return root;
}
