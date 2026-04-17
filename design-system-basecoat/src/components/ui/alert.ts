// ─── Alert ───────────────────────────────────────────────────────────────────

export type AlertVariant = 'default' | 'destructive';

export interface AlertOptions {
  variant?: AlertVariant;
  /** Additional CSS classes to append. */
  className?: string;
}

export interface AlertTitleOptions {
  text?: string;
  className?: string;
}

export interface AlertDescriptionOptions {
  text?: string;
  className?: string;
}

export function createAlert(options: AlertOptions = {}): HTMLElement {
  const { variant = 'default', className } = options;

  const el = document.createElement('div');
  el.setAttribute('role', 'alert');
  el.className = variant === 'destructive' ? 'alert alert-destructive' : 'alert';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createAlertTitle(options: AlertTitleOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('h5');
  el.className = 'mb-1 font-medium leading-none tracking-tight';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('div');
  el.className = 'text-sm [&_p]:leading-relaxed';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}
