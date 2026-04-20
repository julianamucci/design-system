// ─── Label ───────────────────────────────────────────────────────────────────

export interface LabelOptions {
  text?: string;
  /** The id of the form control this label describes. */
  htmlFor?: string;
  /** Additional CSS classes to append. */
  className?: string;
}

export function createLabel(options: LabelOptions = {}): HTMLLabelElement {
  const { text = '', htmlFor, className } = options;

  const el = document.createElement('label');
  el.className = 'label';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (htmlFor) el.htmlFor = htmlFor;
  if (text) el.textContent = text;

  return el;
}
