// ─── Collapsible — Vanilla factory standalone ───────────────────────────────
//
// Visual: classe .nds-collapsible no wrapper (apenas largura).
// Sem visual próprio para trigger/content — consumidor estiliza livremente.
// Comportamento: aria-expanded/aria-hidden + data-state="open|closed" + hidden.

import { cn } from '@/lib/utils';

export type CollapsibleOptions = {
  trigger: string | HTMLElement;
  content: HTMLElement;
  /** Estado inicial no modo não-controlado. Ignorado quando `open` é passado. */
  defaultOpen?: boolean;
  /**
   * Estado no modo CONTROLADO. Passar este campo transfere a posse do estado
   * para quem chamou: o clique no trigger deixa de mexer no DOM sozinho e passa
   * só a emitir `onOpenChange`, e quem manda escreve de volta por `setOpen`.
   * É o equivalente imperativo da prop `open` das outras stacks.
   */
  open?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

/** O wrapper devolvido, com o setter do modo controlado. */
export type CollapsibleElement = HTMLElement & {
  /** Escreve o estado de fora. Não reemite `onOpenChange`. */
  setOpen: (open: boolean) => void;
};

let _collapsibleCounter = 0;

export function createCollapsible(options: CollapsibleOptions): CollapsibleElement {
  const {
    trigger,
    content,
    defaultOpen = false,
    disabled = false,
    onOpenChange,
  } = options;

  const controlled = options.open !== undefined;

  const id = ++_collapsibleCounter;
  const contentId = `collapsible-content-${id}`;

  let isOpen = controlled ? !!options.open : defaultOpen;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'collapsible';
  wrapper.className = cn('nds-collapsible', options.class);

  // Trigger button
  let triggerEl: HTMLButtonElement;
  if (typeof trigger === 'string') {
    triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.textContent = trigger;
  } else if (trigger instanceof HTMLButtonElement) {
    triggerEl = trigger;
    triggerEl.type = triggerEl.type || 'button';
  } else {
    triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.appendChild(trigger);
  }

  triggerEl.setAttribute('aria-controls', contentId);
  triggerEl.setAttribute('aria-expanded', String(isOpen));
  triggerEl.dataset.slot = 'collapsible-trigger';

  if (disabled) {
    triggerEl.disabled = true;
    triggerEl.setAttribute('aria-disabled', 'true');
  }

  // Content
  const contentEl = document.createElement('div');
  contentEl.id = contentId;
  contentEl.dataset.slot = 'collapsible-content';
  contentEl.setAttribute('aria-hidden', String(!isOpen));
  contentEl.hidden = !isOpen;
  contentEl.appendChild(content);

  /** Só o DOM. Quem notifica é o chamador. */
  function aplicar(next: boolean): void {
    isOpen = next;
    triggerEl.setAttribute('aria-expanded', String(isOpen));
    contentEl.setAttribute('aria-hidden', String(!isOpen));
    contentEl.hidden = !isOpen;
    triggerEl.dataset.state = isOpen ? 'open' : 'closed';
    contentEl.dataset.state = isOpen ? 'open' : 'closed';
  }

  triggerEl.dataset.state = isOpen ? 'open' : 'closed';
  contentEl.dataset.state = isOpen ? 'open' : 'closed';

  if (!disabled) {
    triggerEl.addEventListener('click', () => {
      const next = !isOpen;
      // No modo controlado o DOM não se move sozinho: o trigger apenas propõe o
      // novo valor, e quem é dono do estado decide se ele vale.
      if (!controlled) aplicar(next);
      onOpenChange?.(next);
    });
  }

  wrapper.appendChild(triggerEl);
  wrapper.appendChild(contentEl);

  return Object.assign(wrapper, {
    setOpen: (next: boolean) => {
      if (next === isOpen) return;
      aplicar(next);
    },
  });
}
