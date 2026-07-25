import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectOptions = {
  items: SelectItem[];
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  class?: string;
};

// ─── createSelect ─────────────────────────────────────────────────────────────

export function createSelect(options: SelectOptions): HTMLSelectElement {
  const { items, placeholder, defaultValue, disabled = false, onValueChange } = options;

  const select = document.createElement('select');
  select.className = cn('select', options.class);
  select.dataset.slot = 'select';

  if (disabled) select.disabled = true;

  if (placeholder) {
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = placeholder;
    placeholderOpt.disabled = true;
    placeholderOpt.selected = defaultValue === undefined || defaultValue === '';
    placeholderOpt.hidden = true;
    select.appendChild(placeholderOpt);
  }

  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.label;
    if (item.disabled) opt.disabled = true;
    if (item.value === defaultValue) opt.selected = true;
    select.appendChild(opt);
  });

  if (onValueChange) {
    select.addEventListener('change', () => onValueChange(select.value));
  }

  return select;
}
