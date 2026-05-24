// ─── Collapsible — Vanilla factory standalone ───────────────────────────────
//
// Visual: classe .nds-collapsible no wrapper (apenas largura).
// Sem visual próprio para trigger/content — consumidor estiliza livremente.
// Comportamento: aria-expanded/aria-hidden + data-state="open|closed" + hidden.

export type CollapsibleOptions = {
  trigger: string | HTMLElement;
  content: HTMLElement;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

let _collapsibleCounter = 0;

export function createCollapsible(options: CollapsibleOptions): HTMLElement {
  const {
    trigger,
    content,
    defaultOpen = false,
    disabled = false,
    onOpenChange,
  } = options;

  const id = ++_collapsibleCounter;
  const contentId = `collapsible-content-${id}`;

  let isOpen = defaultOpen;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'collapsible';
  wrapper.className = 'nds-collapsible';
  if (options.class) wrapper.classList.add(...options.class.split(' ').filter(Boolean));

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

  function setOpen(next: boolean): void {
    isOpen = next;
    triggerEl.setAttribute('aria-expanded', String(isOpen));
    contentEl.setAttribute('aria-hidden', String(!isOpen));
    contentEl.hidden = !isOpen;
    triggerEl.dataset.state = isOpen ? 'open' : 'closed';
    contentEl.dataset.state = isOpen ? 'open' : 'closed';
    onOpenChange?.(isOpen);
  }

  triggerEl.dataset.state = isOpen ? 'open' : 'closed';
  contentEl.dataset.state = isOpen ? 'open' : 'closed';

  if (!disabled) {
    triggerEl.addEventListener('click', () => setOpen(!isOpen));
  }

  wrapper.appendChild(triggerEl);
  wrapper.appendChild(contentEl);

  return wrapper;
}
