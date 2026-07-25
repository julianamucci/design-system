import { cn } from '@/lib/utils';

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
  root.className = cn(
    'command flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
    options.class
  );

  // Search input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'flex items-center border-b px-3';

  const searchIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 shrink-0 opacity-50" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

  inputWrapper.innerHTML = searchIcon;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className =
    'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'true');
  inputWrapper.appendChild(input);
  root.appendChild(inputWrapper);

  // List
  const list = document.createElement('div');
  list.className = 'max-h-[300px] overflow-y-auto overflow-x-hidden';
  list.setAttribute('role', 'listbox');
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
      const empty = document.createElement('p');
      empty.className = 'py-6 text-center text-sm text-muted-foreground';
      empty.textContent = 'No results found.';
      list.appendChild(empty);
      return;
    }

    const grouped = groupItems(filtered);

    grouped.forEach((groupItems, groupName) => {
      if (groupName) {
        const groupEl = document.createElement('div');
        groupEl.className = 'overflow-hidden p-1 text-foreground';
        const heading = document.createElement('div');
        heading.className = 'px-2 py-1.5 text-xs font-medium text-muted-foreground';
        heading.textContent = groupName;
        groupEl.appendChild(heading);

        groupItems.forEach((item) => {
          const el = buildItemEl(item);
          groupEl.appendChild(el);
          visibleItems.push(el);
        });

        list.appendChild(groupEl);
      } else {
        const groupEl = document.createElement('div');
        groupEl.className = 'overflow-hidden p-1 text-foreground';

        groupItems.forEach((item) => {
          const el = buildItemEl(item);
          groupEl.appendChild(el);
          visibleItems.push(el);
        });

        list.appendChild(groupEl);
      }
    });
  }

  function buildItemEl(item: CommandItem): HTMLElement {
    const el = document.createElement('div');
    el.dataset.slot = 'command-item';
    el.dataset.value = item.value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', 'false');
    el.className = cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      item.disabled
        ? 'pointer-events-none opacity-50'
        : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
    );
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
        el.classList.add('bg-accent', 'text-accent-foreground');
        el.setAttribute('aria-selected', 'true');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('bg-accent', 'text-accent-foreground');
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
