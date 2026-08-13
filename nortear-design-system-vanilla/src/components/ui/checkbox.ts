import { cn } from '@/lib/utils';

import DOMPurify from 'dompurify';

// ─── Checkbox — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-checkbox + .nds-checkbox-indicator (standalone).
// Estado controlado via data-state="checked|unchecked" + aria-checked.

const SVG_ABRE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true">';

const CHECK_SVG = `${SVG_ABRE}<polyline points="20 6 9 20 4 15"/></svg>`;
const MINUS_SVG = `${SVG_ABRE}<line x1="5" y1="12" x2="19" y2="12"/></svg>`;

export type CheckboxOptions = {
  checked?: boolean;
  /**
   * Estado misto — "alguns dos filhos selecionados". Vale sobre `checked`
   * enquanto durar, e o primeiro clique o resolve para marcado, como faz a
   * propriedade `indeterminate` do input nativo.
   */
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Disparado quando o estado misto é resolvido por interação. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

export function createCheckbox(options: CheckboxOptions = {}): HTMLElement {
  const { disabled = false, onCheckedChange, onIndeterminateChange, id } = options;
  let checked = options.checked ?? false;
  let indeterminate = options.indeterminate ?? false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'checkbox';
  wrapper.className = cn('nds-checkbox', options.class);
  wrapper.setAttribute('role', 'checkbox');
  wrapper.setAttribute('tabindex', disabled ? '-1' : '0');

  if (options['aria-label']) wrapper.setAttribute('aria-label', options['aria-label']);
  if (id) wrapper.id = id;
  if (disabled) wrapper.setAttribute('aria-disabled', 'true');

  const indicator = document.createElement('span');
  indicator.dataset.slot = 'checkbox-indicator';
  indicator.className = 'nds-checkbox-indicator';

  wrapper.append(indicator);

  // O input nativo NÃO entra no DOM: dois elementos interativos aninhados
  // quebram WCAG/axe (nested-interactive), e o `role="checkbox"` já está no
  // wrapper. Quem precisa de submit nativo lê `onCheckedChange` e escreve o
  // próprio campo — é a divergência assumida em relação às stacks que rodam
  // lib headless, que renderizam esse input por conta própria.

  function pintar(): void {
    wrapper.dataset.state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
    // "mixed" é o que distingue "alguns selecionados" de "todos selecionados";
    // um booleano aqui mentiria para quem lê a tela.
    wrapper.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
    indicator.style.display = indeterminate || checked ? '' : 'none';
    // Constantes literais internas; sanitize no call site por convenção do
    // projeto (guideline 09 — o SAST precisa ver o sanitizador aqui).
    indicator.innerHTML = DOMPurify.sanitize(indeterminate ? MINUS_SVG : CHECK_SVG);
  }

  pintar();

  function alternar(): void {
    if (indeterminate) {
      indeterminate = false;
      checked = true;
      pintar();
      onIndeterminateChange?.(false);
      onCheckedChange?.(true);
      return;
    }
    checked = !checked;
    pintar();
    onCheckedChange?.(checked);
  }

  if (!disabled) {
    wrapper.addEventListener('click', alternar);
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        alternar();
      }
    });
  }

  return wrapper;
}
