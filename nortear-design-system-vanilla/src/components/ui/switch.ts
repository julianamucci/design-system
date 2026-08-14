// ─── Switch — Vanilla factory standalone ────────────────────────────────────
//
// Visual: classes .nds-switch + .nds-switch-thumb (standalone).
// Estado via data-state="checked|unchecked" + aria-checked.

import { cn } from '@/lib/utils';

export type SwitchSize = 'default' | 'sm';

export type SwitchOptions = {
  checked?: boolean;
  disabled?: boolean;
  /**
   * Degrau de tamanho. Vira `data-size`, que é onde o CSS compartilhado guarda
   * a medida do trilho e do thumb — peça sem texto tem medida explícita
   * (guideline 12), e ela mora no CSS, não aqui.
   *
   * Antes de existir, as stories replicavam o degrau com `class: 'h-4 w-7'` —
   * vocabulário do framework utilitário que saiu do projeto, inerte em runtime:
   * o "compacto" era do mesmo tamanho do padrão e nenhum teste via.
   */
  size?: SwitchSize;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

export function createSwitch(options: SwitchOptions = {}): HTMLButtonElement {
  const { disabled = false, size = 'default', onCheckedChange, id } = options;
  let checked = options.checked ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.slot = 'switch';
  btn.dataset.size = size;
  btn.className = cn('nds-switch', options.class);
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
