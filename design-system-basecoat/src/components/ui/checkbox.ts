import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Checkbox classes ─────────────────────────────────────────────────────────

// PATCH: theme — Basecoat uses data-[state=checked] (not data-checked) due to vanilla DOM;
// rounded-[4px] replaces rounded-sm; border-input replaces border-primary; no shadow;
// focus-visible:ring-3 and ring/50 align with React; aria-invalid classes added for error state.
// Acceptable divergences: data-[state=checked] vs data-checked (known), no peer/group classes (no Tailwind JIT sibling targeting in vanilla DOM).
const CHECKBOX_ROOT =
  'peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none ' +
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ' +
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 ' +
  'dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 ' +
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary';

const CHECKBOX_INDICATOR = 'grid place-content-center text-current transition-none [&>svg]:size-3.5';

const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"><polyline points="20 6 9 20 4 15"/></svg>';

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
  // Safe: CHECK_SVG is a static literal constant defined in this module, not user input.
  // sanitizeHtml used to satisfy the security audit rule.
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
