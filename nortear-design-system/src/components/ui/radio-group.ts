// ─── Radio Group — Vanilla factory standalone ───────────────────────────────
//
// Visual: classes .nds-radio-* (zero Tailwind/basecoat-css).
// Estado controlado via aria-checked + display do .nds-radio-indicator.
// Native <input type="radio"> presente em cada item para participação em forms.

const RADIO_INDICATOR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" ' +
  'aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>';

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

export function createRadioGroup(options: RadioGroupOptions): HTMLElement {
  const { name, items, defaultValue, onValueChange } = options;

  const fieldset = document.createElement('fieldset');
  fieldset.dataset.slot = 'radio-group';
  fieldset.className = 'nds-radio-group';
  if (options.class) fieldset.classList.add(...options.class.split(' ').filter(Boolean));

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

  items.forEach((item) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'nds-radio-row';

    const labelId = `${name}-${item.value}-label`;

    const itemBtn = document.createElement('button');
    itemBtn.type = 'button';
    itemBtn.dataset.slot = 'radio-group-item';
    itemBtn.dataset.value = item.value;
    itemBtn.className = 'nds-radio-item';
    itemBtn.setAttribute('role', 'radio');
    itemBtn.setAttribute('aria-checked', String(item.value === defaultValue));
    itemBtn.setAttribute('aria-labelledby', labelId);
    if (item.disabled) itemBtn.disabled = true;

    const indicatorSpan = document.createElement('span');
    indicatorSpan.dataset.slot = 'radio-indicator';
    indicatorSpan.className = 'nds-radio-indicator';
    indicatorSpan.style.display = item.value === defaultValue ? '' : 'none';

    // SVG parseado e anexado (não innerHTML em elemento do fluxo).
    const wrap = document.createElement('span');
    wrap.innerHTML = RADIO_INDICATOR_SVG;
    const svg = wrap.firstElementChild;
    if (svg) indicatorSpan.appendChild(svg);
    itemBtn.appendChild(indicatorSpan);

    const nativeInput = document.createElement('input');
    nativeInput.type = 'radio';
    nativeInput.name = name;
    nativeInput.value = item.value;
    nativeInput.checked = item.value === defaultValue;
    nativeInput.disabled = item.disabled ?? false;
    nativeInput.setAttribute('aria-hidden', 'true');
    nativeInput.tabIndex = -1;
    // Hidden native input — kept as sibling (not nested inside the button)
    // to satisfy WCAG/axe nested-interactive rule.
    nativeInput.style.position = 'absolute';
    nativeInput.style.width = '1px';
    nativeInput.style.height = '1px';
    nativeInput.style.padding = '0';
    nativeInput.style.margin = '-1px';
    nativeInput.style.overflow = 'hidden';
    nativeInput.style.clip = 'rect(0,0,0,0)';
    nativeInput.style.whiteSpace = 'nowrap';
    nativeInput.style.border = '0';

    const labelEl = document.createElement('label');
    labelEl.id = labelId;
    labelEl.className = 'nds-radio-label';
    labelEl.textContent = item.label;

    rowEl.append(itemBtn, labelEl, nativeInput);
    fieldset.appendChild(rowEl);

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
