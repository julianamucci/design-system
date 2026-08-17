import { cn } from '@/lib/utils';
// ─── Separator — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-separator (standalone).
// Decorativo por default (role="none"); use decorative:false para semântico.

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorEmphasis = 'default' | 'strong';

export interface SeparatorOptions {
  orientation?: SeparatorOrientation;
  /** When true the separator is purely visual and hidden from assistive tech. */
  decorative?: boolean;
  /** `strong` dobra a espessura e troca o token de cor da linha. */
  emphasis?: SeparatorEmphasis;
  className?: string;
}

export function createSeparator(options: SeparatorOptions = {}): HTMLElement {
  const { orientation = 'horizontal', decorative = true, emphasis = 'default', className } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'separator';
  el.dataset.orientation = orientation;
  el.className = cn('nds-separator', className);

  // A folha compartilhada só conhece `strong`; o valor default não vira
  // atributo para o DOM não carregar um estado que não muda nada.
  if (emphasis === 'strong') el.dataset.emphasis = 'strong';

  if (decorative) {
    el.setAttribute('role', 'none');
    el.setAttribute('aria-hidden', 'true');
    // Sem `aria-orientation`: o atributo não é permitido em role="none" e nada
    // informaria fora da árvore de acessibilidade.
  } else {
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', orientation);
  }

  return el;
}
