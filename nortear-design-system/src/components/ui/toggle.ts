// ─── Toggle — Vanilla factory standalone ────────────────────────────────────
//
// Visual: classe .nds-toggle (zero Tailwind/basecoat-css).
// Variantes/tamanhos via data-variant/data-size.

export type ToggleVariant = 'default' | 'outline';
export type ToggleSize = 'default' | 'sm' | 'lg';

export type ToggleOptions = {
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  class?: string;
  onClick?: (pressed: boolean) => void;
  children?: HTMLElement | string;
};

export function createToggle(options: ToggleOptions = {}): HTMLButtonElement {
  const { disabled = false, variant = 'default', size = 'default', onClick } = options;
  let pressed = options.pressed ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.slot = 'toggle';
  btn.className = 'nds-toggle';
  if (options.class) btn.classList.add(...options.class.split(' ').filter(Boolean));
  if (variant !== 'default') btn.dataset.variant = variant;
  if (size !== 'default') btn.dataset.size = size;
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-pressed', String(pressed));
  btn.dataset.state = pressed ? 'on' : 'off';

  if (disabled) btn.disabled = true;

  if (options.children) {
    if (typeof options.children === 'string') {
      btn.textContent = options.children;
    } else {
      btn.appendChild(options.children);
    }
  }

  function setPressed(next: boolean): void {
    pressed = next;
    btn.setAttribute('aria-pressed', String(next));
    btn.dataset.state = next ? 'on' : 'off';
    onClick?.(next);
  }

  if (!disabled) {
    btn.addEventListener('click', () => setPressed(!pressed));
  }

  return btn;
}
