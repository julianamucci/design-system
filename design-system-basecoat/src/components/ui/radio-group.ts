import { cn } from '@/lib/utils';

// ─── Radio-group classes ──────────────────────────────────────────────────────

const RADIO_ITEM =
  'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow ' +
  'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const RADIO_INDICATOR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ' +
  'fill="currentColor" class="h-3.5 w-3.5 fill-primary" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadioGroupItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupOptions = {
  name: string;
  items: RadioGroupItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  class?: string;
};

// ─── createRadioGroup ─────────────────────────────────────────────────────────

export function createRadioGroup(options: RadioGroupOptions): HTMLElement {
  const { name, items, defaultValue, onValueChange } = options;

  const fieldset = document.createElement('fieldset');
  fieldset.className = cn('grid gap-2 border-0 p-0 m-0', options.class);
  fieldset.dataset.slot = 'radio-group';

  items.forEach((item) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'flex items-center gap-2';

    // Custom visual button
    const itemBtn = document.createElement('button');
    itemBtn.type = 'button';
    itemBtn.className = cn(RADIO_ITEM);
    itemBtn.dataset.slot = 'radio-group-item';
    itemBtn.dataset.value = item.value;
    itemBtn.setAttribute('role', 'radio');
    itemBtn.setAttribute('aria-checked', String(item.value === defaultValue));
    if (item.disabled) {
      itemBtn.disabled = true;
    }

    const indicatorSpan = document.createElement('span');
    indicatorSpan.className = 'grid place-content-center';
    indicatorSpan.dataset.slot = 'radio-indicator';
    indicatorSpan.style.display = item.value === defaultValue ? '' : 'none';
    indicatorSpan.innerHTML = RADIO_INDICATOR_SVG;
    itemBtn.appendChild(indicatorSpan);

    // Hidden native input for form participation
    const nativeInput = document.createElement('input');
    nativeInput.type = 'radio';
    nativeInput.name = name;
    nativeInput.value = item.value;
    nativeInput.checked = item.value === defaultValue;
    nativeInput.disabled = item.disabled ?? false;
    nativeInput.setAttribute('aria-hidden', 'true');
    nativeInput.tabIndex = -1;
    nativeInput.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';

    const labelEl = document.createElement('label');
    labelEl.className = 'text-sm font-medium leading-none';
    labelEl.textContent = item.label;

    rowEl.append(itemBtn, nativeInput, labelEl);
    fieldset.appendChild(rowEl);

    function selectItem(value: string): void {
      fieldset.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
        const v = btn.dataset.value!;
        const isSelected = v === value;
        btn.setAttribute('aria-checked', String(isSelected));
        const ind = btn.querySelector<HTMLElement>('[data-slot="radio-indicator"]');
        if (ind) ind.style.display = isSelected ? '' : 'none';
      });
      fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((inp) => {
        inp.checked = inp.value === value;
      });
      onValueChange?.(value);
    }

    if (!item.disabled) {
      itemBtn.addEventListener('click', () => selectItem(item.value));
      labelEl.addEventListener('click', () => selectItem(item.value));
      itemBtn.addEventListener('keydown', (e) => {
        const allBtns = Array.from(
          fieldset.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]:not([disabled])')
        );
        const idx = allBtns.indexOf(itemBtn);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          allBtns[(idx + 1) % allBtns.length]?.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          allBtns[(idx - 1 + allBtns.length) % allBtns.length]?.focus();
        }
      });
    }
  });

  return fieldset;
}
