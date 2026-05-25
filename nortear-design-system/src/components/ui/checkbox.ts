import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Checkbox — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-checkbox + .nds-checkbox-indicator (zero Tailwind).
// Estado controlado via data-state="checked|unchecked" + aria-checked.

const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"><polyline points="20 6 9 20 4 15"/></svg>';

export type CheckboxOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

export function createCheckbox(options: CheckboxOptions = {}): HTMLElement {
  const { disabled = false, onCheckedChange, id } = options;
  let checked = options.checked ?? false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'checkbox';
  wrapper.dataset.state = checked ? 'checked' : 'unchecked';
  wrapper.className = 'nds-checkbox';
  if (options.class) wrapper.classList.add(...options.class.split(' ').filter(Boolean));
  wrapper.setAttribute('role', 'checkbox');
  wrapper.setAttribute('aria-checked', String(checked));
  wrapper.setAttribute('tabindex', disabled ? '-1' : '0');

  if (options['aria-label']) wrapper.setAttribute('aria-label', options['aria-label']);
  if (id) wrapper.id = id;
  if (disabled) wrapper.setAttribute('aria-disabled', 'true');

  // Native input para participação em forms (sr-only via CSS).
  const nativeInput = document.createElement('input');
  nativeInput.type = 'checkbox';
  nativeInput.checked = checked;
  nativeInput.disabled = disabled;
  nativeInput.setAttribute('aria-hidden', 'true');
  nativeInput.tabIndex = -1;
  if (id) nativeInput.id = `${id}-native`;

  const indicator = document.createElement('span');
  indicator.dataset.slot = 'checkbox-indicator';
  indicator.className = 'nds-checkbox-indicator';
  indicator.style.display = checked ? '' : 'none';
  // CHECK_SVG é constante literal interna; sanitize por convenção do projeto.
  indicator.innerHTML = sanitizeHtml(CHECK_SVG);

  wrapper.append(nativeInput, indicator);

  function setChecked(next: boolean): void {
    checked = next;
    nativeInput.checked = next;
    wrapper.dataset.state = next ? 'checked' : 'unchecked';
    wrapper.setAttribute('aria-checked', String(next));
    indicator.style.display = next ? '' : 'none';
    onCheckedChange?.(next);
  }

  if (!disabled) {
    wrapper.addEventListener('click', () => setChecked(!checked));
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        setChecked(!checked);
      }
    });
  }

  return wrapper;
}
