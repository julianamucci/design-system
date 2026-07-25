import { cn } from '@/lib/utils';

// ─── Toggle classes ───────────────────────────────────────────────────────────

const TOGGLE_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ' +
  'hover:bg-muted hover:text-muted-foreground ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ' +
  '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent';

const TOGGLE_SIZES: Record<string, string> = {
  default: 'h-9 px-2 min-w-9',
  sm: 'h-8 px-1.5 min-w-8',
  lg: 'h-10 px-2.5 min-w-10',
};

const TOGGLE_OUTLINE = 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── createToggle ─────────────────────────────────────────────────────────────

export function createToggle(options: ToggleOptions = {}): HTMLButtonElement {
  const { disabled = false, variant = 'default', size = 'default', onClick } = options;
  let pressed = options.pressed ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.slot = 'toggle';
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-pressed', String(pressed));
  btn.dataset.state = pressed ? 'on' : 'off';

  const variantClass = variant === 'outline' ? TOGGLE_OUTLINE : '';
  btn.className = cn(TOGGLE_BASE, variantClass, TOGGLE_SIZES[size], options.class);

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
