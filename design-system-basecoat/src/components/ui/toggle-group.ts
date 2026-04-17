import { cn } from '@/lib/utils';
import { createToggle, type ToggleVariant } from './toggle';

// ─── Toggle-group classes ─────────────────────────────────────────────────────

const GROUP_BASE = 'flex items-center justify-center gap-1';
const GROUP_OUTLINE =
  'rounded-md border border-input shadow-sm ' +
  '[&>button:not(:first-child)]:rounded-l-none ' +
  '[&>button:not(:last-child)]:rounded-r-none ' +
  '[&>button:not(:first-child)]:border-l-0';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToggleGroupItem = {
  value: string;
  label?: string;
  children?: string;
  disabled?: boolean;
};

export type ToggleGroupOptions = {
  type?: 'single' | 'multiple';
  variant?: ToggleVariant;
  items: ToggleGroupItem[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  class?: string;
};

// ─── createToggleGroup ────────────────────────────────────────────────────────

export function createToggleGroup(options: ToggleGroupOptions): HTMLElement {
  const { type = 'single', variant = 'default', items, onValueChange } = options;

  let activeValues: Set<string>;
  if (options.defaultValue !== undefined) {
    activeValues = new Set(
      Array.isArray(options.defaultValue) ? options.defaultValue : [options.defaultValue]
    );
  } else {
    activeValues = new Set();
  }

  const root = document.createElement('div');
  root.className = cn(GROUP_BASE, variant === 'outline' ? GROUP_OUTLINE : '', options.class);
  root.dataset.slot = 'toggle-group';
  root.setAttribute('role', 'group');

  function notifyChange(): void {
    if (!onValueChange) return;
    if (type === 'single') {
      onValueChange([...activeValues][0] ?? '');
    } else {
      onValueChange([...activeValues]);
    }
  }

  items.forEach((item) => {
    const btn = createToggle({
      pressed: activeValues.has(item.value),
      disabled: item.disabled,
      variant,
      children: item.children ?? item.label ?? item.value,
      onClick: () => {
        const isActive = activeValues.has(item.value);
        if (type === 'single') {
          if (isActive) {
            activeValues.clear();
          } else {
            activeValues.clear();
            activeValues.add(item.value);
          }
          // Sync all button states
          root.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((b) => {
            const v = b.dataset.value!;
            const active = activeValues.has(v);
            b.setAttribute('aria-pressed', String(active));
            b.dataset.state = active ? 'on' : 'off';
          });
        } else {
          if (isActive) {
            activeValues.delete(item.value);
          } else {
            activeValues.add(item.value);
          }
          btn.setAttribute('aria-pressed', String(!isActive));
          btn.dataset.state = !isActive ? 'on' : 'off';
        }
        notifyChange();
      },
    });
    btn.dataset.value = item.value;
    root.appendChild(btn);
  });

  return root;
}
