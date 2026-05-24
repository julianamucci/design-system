// ─── Accordion — Vanilla factory alinhada ao primitive React (shadcn) ────────
//
// Visual: classes .nds-accordion-* (standalone, sem Tailwind/basecoat-css).
// Comportamentos preservados:
//   - type="single" | "multiple" + collapsible
//   - defaultValue (string | string[])
//   - data-state="open|closed" no trigger e content (chevron gira via CSS)
//   - keyboard: ArrowUp/Down, Home, End
//   - disabled por item

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-accordion-icon" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

// ─── Types ───────────────────────────────────────────────────────────────────

export type AccordionOptions = {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  items: Array<{
    value: string;
    trigger: string;
    content: string;
    disabled?: boolean;
  }>;
  class?: string;
  onValueChange?: (value: string | string[]) => void;
};

// ─── createAccordion ─────────────────────────────────────────────────────────

export function createAccordion(options: AccordionOptions): HTMLElement {
  const { type = 'single', collapsible = true, defaultValue, items, onValueChange } = options;

  const openValues: Set<string> =
    defaultValue !== undefined
      ? new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
      : new Set();

  const root = document.createElement('div');
  root.dataset.slot = 'accordion';
  root.className = 'nds-accordion';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  function isOpen(value: string): boolean {
    return openValues.has(value);
  }

  function toggle(value: string, triggerEl: HTMLButtonElement, contentEl: HTMLElement): void {
    const currentlyOpen = isOpen(value);

    if (type === 'single') {
      if (currentlyOpen) {
        if (collapsible) openValues.delete(value);
        else return;
      } else {
        openValues.clear();
        openValues.add(value);
      }
    } else {
      if (currentlyOpen) openValues.delete(value);
      else openValues.add(value);
    }

    updateItemState(triggerEl, contentEl, isOpen(value));

    if (type === 'single') {
      root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]').forEach(t => {
        if (t !== triggerEl) {
          const itemValue = t.dataset.value!;
          const c = root.querySelector<HTMLElement>(`[data-content-for="${itemValue}"]`);
          updateItemState(t, c!, isOpen(itemValue));
        }
      });
    }

    if (onValueChange) {
      const val = type === 'multiple' ? [...openValues] : [...openValues][0] ?? '';
      onValueChange(val);
    }
  }

  function updateItemState(triggerEl: HTMLButtonElement, contentEl: HTMLElement, open: boolean): void {
    triggerEl.setAttribute('aria-expanded', String(open));
    contentEl.hidden = !open;
    triggerEl.dataset.state = open ? 'open' : 'closed';
    contentEl.dataset.state = open ? 'open' : 'closed';
  }

  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.dataset.slot = 'accordion-item';
    itemEl.className = 'nds-accordion-item';

    const headerEl = document.createElement('h3');
    headerEl.className = 'nds-accordion-header';

    const triggerId = `accordion-trigger-${item.value}`;
    const contentId = `accordion-content-${item.value}`;

    const triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.id = triggerId;
    triggerEl.dataset.slot = 'accordion-trigger';
    triggerEl.dataset.value = item.value;
    triggerEl.setAttribute('aria-controls', contentId);
    triggerEl.setAttribute('aria-expanded', 'false');
    triggerEl.className = 'nds-accordion-trigger';
    if (item.disabled) triggerEl.disabled = true;

    const triggerSpan = document.createElement('span');
    triggerSpan.textContent = item.trigger;
    triggerEl.appendChild(triggerSpan);
    triggerEl.insertAdjacentHTML('beforeend', CHEVRON_SVG);
    headerEl.appendChild(triggerEl);

    const contentEl = document.createElement('div');
    contentEl.id = contentId;
    contentEl.dataset.slot = 'accordion-content';
    contentEl.setAttribute('data-content-for', item.value);
    contentEl.setAttribute('role', 'region');
    contentEl.setAttribute('aria-labelledby', triggerId);
    contentEl.className = 'nds-accordion-content';
    contentEl.hidden = true;
    contentEl.dataset.state = 'closed';

    const innerEl = document.createElement('div');
    innerEl.className = 'nds-accordion-content-inner';
    innerEl.textContent = item.content;
    contentEl.appendChild(innerEl);

    if (isOpen(item.value)) {
      updateItemState(triggerEl, contentEl, true);
    }

    if (!item.disabled) {
      triggerEl.addEventListener('click', () => toggle(item.value, triggerEl, contentEl));
    }

    triggerEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const all = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])'));
        const currentIdx = all.indexOf(triggerEl);
        const nextIdx = e.key === 'ArrowDown'
          ? (currentIdx + 1) % all.length
          : (currentIdx - 1 + all.length) % all.length;
        all[nextIdx]?.focus();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])')[0]?.focus();
      }
      if (e.key === 'End') {
        e.preventDefault();
        const all = root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])');
        all[all.length - 1]?.focus();
      }
    });

    itemEl.append(headerEl, contentEl);
    root.appendChild(itemEl);
  });

  return root;
}
