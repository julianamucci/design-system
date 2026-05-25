// ─── Label — Vanilla factory standalone ──────────────────────────────────────
//
// Visual: classe .nds-label (zero Tailwind/basecoat-css).
// Estado disabled propaga: via .peer (controle irmão) ou via ancestral
// data-disabled="true" / fieldset:disabled.

export interface LabelOptions {
  text?: string;
  /** id do controle associado (input, select, etc.). */
  htmlFor?: string;
  className?: string;
}

export function createLabel(options: LabelOptions = {}): HTMLLabelElement {
  const { text = '', htmlFor, className } = options;

  const el = document.createElement('label');
  el.dataset.slot = 'label';
  el.className = 'nds-label';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (htmlFor) el.htmlFor = htmlFor;
  if (text) el.textContent = text;

  return el;
}
