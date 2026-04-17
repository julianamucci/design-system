import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent) => void;
  class?: string;
  children?: HTMLElement | string;
};

// ─── btnClass ─────────────────────────────────────────────────────────────────

export function btnClass(variant: ButtonVariant | string = 'default', size: ButtonSize | string = 'default'): string {
  const prefix = size === 'icon' ? 'btn-icon' : size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn';
  return variant === 'default' ? prefix : `${prefix}-${variant}`;
}

// ─── createButton ─────────────────────────────────────────────────────────────

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const { variant = 'default', size = 'default', label, ariaLabel, disabled, type = 'button', onClick, children } = options;

  const el = document.createElement('button');
  el.type = type;
  el.className = cn(btnClass(variant, size), options.class);

  if (label) el.textContent = label;
  if (ariaLabel) el.setAttribute('aria-label', ariaLabel);
  if (disabled) el.disabled = true;

  if (children) {
    if (typeof children === 'string') {
      el.innerHTML = children;
    } else {
      el.appendChild(children);
    }
  }

  if (onClick) el.addEventListener('click', onClick);

  return el;
}
