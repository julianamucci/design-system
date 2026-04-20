import { cn } from '@/lib/utils';

// ─── Checkbox classes ─────────────────────────────────────────────────────────

const CHECKBOX_ROOT =
  'grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground';

const CHECKBOX_INDICATOR = 'grid place-content-center text-current';

const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  'class="h-4 w-4 stroke-current" aria-hidden="true"><polyline points="20 6 9 20 4 15"/></svg>';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

// ─── createCheckbox ───────────────────────────────────────────────────────────

export function createCheckbox(options: CheckboxOptions = {}): HTMLElement {
  const { disabled = false, onCheckedChange, id } = options;
  let checked = options.checked ?? false;

  // Wrapper div acts as the visual root (replaces Radix root button)
  const wrapper = document.createElement('div');
  wrapper.className = cn(CHECKBOX_ROOT, options.class);
  wrapper.dataset.slot = 'checkbox';
  wrapper.dataset.state = checked ? 'checked' : 'unchecked';
  wrapper.setAttribute('role', 'checkbox');
  wrapper.setAttribute('aria-checked', String(checked));
  wrapper.setAttribute('tabindex', disabled ? '-1' : '0');

  if (options['aria-label']) wrapper.setAttribute('aria-label', options['aria-label']);
  if (id) wrapper.id = id;
  if (disabled) {
    wrapper.setAttribute('aria-disabled', 'true');
    wrapper.classList.add('cursor-not-allowed', 'opacity-50');
  }

  // Hidden native input for form participation
  const nativeInput = document.createElement('input');
  nativeInput.type = 'checkbox';
  nativeInput.checked = checked;
  nativeInput.disabled = disabled;
  nativeInput.setAttribute('aria-hidden', 'true');
  nativeInput.tabIndex = -1;
  nativeInput.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
  if (id) nativeInput.id = `${id}-native`;

  // Indicator
  const indicator = document.createElement('span');
  indicator.className = CHECKBOX_INDICATOR;
  indicator.dataset.slot = 'checkbox-indicator';
  indicator.style.display = checked ? '' : 'none';
  indicator.innerHTML = CHECK_SVG;

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
