// ─── Switch — Vanilla factory standalone ────────────────────────────────────
//
// Visual: classes .nds-switch + .nds-switch-thumb (zero Tailwind).
// Estado via data-state="checked|unchecked" + aria-checked.

export type SwitchOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

export function createSwitch(options: SwitchOptions = {}): HTMLButtonElement {
  const { disabled = false, onCheckedChange, id } = options;
  let checked = options.checked ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.slot = 'switch';
  btn.className = 'nds-switch';
  if (options.class) btn.classList.add(...options.class.split(' ').filter(Boolean));
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', String(checked));
  btn.dataset.state = checked ? 'checked' : 'unchecked';

  if (id) btn.id = id;
  if (options['aria-label']) btn.setAttribute('aria-label', options['aria-label']);
  if (disabled) btn.disabled = true;

  const thumb = document.createElement('span');
  thumb.dataset.slot = 'switch-thumb';
  thumb.className = 'nds-switch-thumb';
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
