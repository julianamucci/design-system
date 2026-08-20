import { cn } from '@/lib/utils';
// ─── Label — Vanilla factory standalone ──────────────────────────────────────
//
// Visual: classe .nds-label (standalone).
// Estado disabled propaga: via .peer (controle irmão) ou via ancestral
// data-disabled="true" / fieldset:disabled.
//
// A opção de classe é `class`, como nas outras fábricas desta stack.
// `className` — o nome herdado do primitivo React — continua aceito como
// apelido para não quebrar chamador; quando os dois vêm, `class` vence.

export interface LabelOptions {
  text?: string;
  /** id do controle associado (input, select, etc.). */
  htmlFor?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export function createLabel(options: LabelOptions = {}): HTMLLabelElement {
  const { text = '', htmlFor } = options;
  const classe = options.class ?? options.className;

  const el = document.createElement('label');
  el.dataset.slot = 'label';
  el.className = cn('nds-label', classe);
  if (htmlFor) el.htmlFor = htmlFor;
  if (text) el.textContent = text;

  return el;
}
