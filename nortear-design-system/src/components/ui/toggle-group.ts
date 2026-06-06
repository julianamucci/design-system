// ─── Toggle Group — Vanilla factory standalone ──────────────────────────────
//
// Visual: classe .nds-toggle-group (zero Tailwind/basecoat-css).
// Tipo (single/multiple) via lógica TS; variante via data-variant.

import { createToggle, type ToggleVariant } from './toggle';

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

export function createToggleGroup(options: ToggleGroupOptions): HTMLElement {
  const { type = 'single', variant = 'default', items, onValueChange } = options;

  const activeValues: Set<string> =
    options.defaultValue !== undefined
      ? new Set(Array.isArray(options.defaultValue) ? options.defaultValue : [options.defaultValue])
      : new Set();

  const root = document.createElement('div');
  root.dataset.slot = 'toggle-group';
  root.className = 'nds-toggle-group';
  if (variant !== 'default') root.dataset.variant = variant;
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));
  root.setAttribute('role', 'toolbar');

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
          root.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((b) => {
            const v = b.dataset.value!;
            const active = activeValues.has(v);
            b.setAttribute('aria-pressed', String(active));
            b.dataset.state = active ? 'on' : 'off';
          });
        } else {
          if (isActive) activeValues.delete(item.value);
          else activeValues.add(item.value);
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
