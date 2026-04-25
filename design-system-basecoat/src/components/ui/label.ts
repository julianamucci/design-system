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
  el.setAttribute('data-slot', 'label');
  el.className =
    'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (htmlFor) el.htmlFor = htmlFor;
  if (text) el.textContent = text;

  return el;
}
