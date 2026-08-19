// ─── ScrollArea — Vanilla factory standalone ────────────────────────────────
// Visual: classes .nds-scroll-area + .nds-scroll-area-viewport (standalone).
//
// A barra é a NATIVA do navegador, de propósito: o que ela entrega de graça é
// arrasto do pegador, roda do mouse, teclado (setas, PageUp/PageDown, Home/End)
// e inércia de toque, tudo com a aparência do sistema operacional.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline. O degrau vai para `data-size` na RAIZ, que é onde a folha compartilhada
// resolve `block-size`; o viewport já é `height: 100%` por ela, então não há
// medida a repetir aqui. Altura fora da escada continua possível pela custom
// property `--box-height`, que a folha governa.
export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ScrollAreaOptions = {
  size?: ScrollAreaSize;
  width?: string;
  /**
   * Nome acessível da região rolável.
   *
   * Com nome, o viewport vira `role="region"` e o leitor de tela anuncia onde a
   * pessoa entrou ao chegar por Tab. Sem nome NÃO emitimos papel nenhum: região
   * anônima não vira landmark, e `aria-label` em elemento sem papel é atributo
   * proibido — o axe acusa `aria-prohibited-attr`.
   *
   * Quando a página tem mais de uma área rolável, os nomes precisam ser
   * DISTINTOS: dois landmarks de mesmo papel e mesmo nome são indistinguíveis
   * na lista de regiões do leitor.
   */
  label?: string;
  class?: string;
  children?: HTMLElement;
};

// ─── createScrollArea ─────────────────────────────────────────────────────────

export function createScrollArea(options: ScrollAreaOptions = {}): HTMLElement {
  const { size, width, label, children } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'scroll-area';
  root.className = cn('nds-scroll-area', options.class);
  if (size) root.dataset.size = size;
  if (width) root.style.width = width;

  const viewport = document.createElement('div');
  viewport.dataset.slot = 'scroll-area-viewport';
  viewport.className = 'nds-scroll-area-viewport';
  // Scrollable regions must be keyboard focusable (WCAG SC 2.1.1).
  viewport.setAttribute('tabindex', '0');
  if (label) {
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', label);
  }
  if (children) viewport.appendChild(children);

  root.appendChild(viewport);
  return root;
}
