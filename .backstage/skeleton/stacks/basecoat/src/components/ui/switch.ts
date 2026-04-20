import { cn } from '@/lib/utils';

// ─── Switch classes ───────────────────────────────────────────────────────────

const SWITCH_ROOT =
  'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full ' +
  'border-2 border-transparent shadow-sm transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input';

const SWITCH_THUMB =
  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ' +
  'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SwitchOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

// ─── createSwitch ─────────────────────────────────────────────────────────────

export function createSwitch(options: SwitchOptions = {}): HTMLButtonElement {
  const { disabled = false, onCheckedChange, id } = options;
  let checked = options.checked ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cn(SWITCH_ROOT, options.class);
  btn.dataset.slot = 'switch';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', String(checked));
  btn.dataset.state = checked ? 'checked' : 'unchecked';

  if (id) btn.id = id;
  if (options['aria-label']) btn.setAttribute('aria-label', options['aria-label']);
  if (disabled) btn.disabled = true;

  const thumb = document.createElement('span');
  thumb.className = SWITCH_THUMB;
  thumb.dataset.slot = 'switch-thumb';
  thumb.dataset.state = checked ? 'checked' : 'unchecked';
  btn.appendChild(thumb);

  function setChecked(next: boolean): void {
    checked = next;
    btn.setAttribute('aria-checked', String(next));
    btn.dataset.state = next ? 'checked' : 'unchecked';
    thumb.dataset.state = next ? 'checked' : 'unchecked';
    onCheckedChange?.(next);
  }

  if (!disabled) {
    btn.addEventListener('click', () => setChecked(!checked));
  }

  return btn;
}
