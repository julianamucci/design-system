import { cn } from '@/lib/utils';

// ─── Accordion classes ────────────────────────────────────────────────────────

const TRIGGER_BASE =
  'flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:underline cursor-pointer';

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

// ─── Types ────────────────────────────────────────────────────────────────────

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

  let openValues: Set<string>;
  if (defaultValue !== undefined) {
    openValues = new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  } else {
    openValues = new Set();
  }

  const root = document.createElement('div');
  root.dataset.slot = 'accordion';
  root.className = cn('w-full', options.class);

  function isOpen(value: string): boolean {
    return openValues.has(value);
  }

  function toggle(value: string, triggerEl: HTMLButtonElement, contentEl: HTMLElement, chevronEl: SVGElement | null): void {
    const currentlyOpen = isOpen(value);

    if (type === 'single') {
      if (currentlyOpen) {
        if (collapsible) {
          openValues.delete(value);
        } else {
          return;
        }
      } else {
        openValues.clear();
        openValues.add(value);
      }
    } else {
      if (currentlyOpen) {
        openValues.delete(value);
      } else {
        openValues.add(value);
      }
    }

    updateItemState(triggerEl, contentEl, chevronEl, isOpen(value));

    if (type === 'single') {
      // Update all other items
      root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]').forEach(t => {
        if (t !== triggerEl) {
          const itemValue = t.dataset.value!;
          const c = root.querySelector<HTMLElement>(`[data-content-for="${itemValue}"]`);
          const ch = t.querySelector<SVGElement>('svg');
          updateItemState(t, c!, ch, isOpen(itemValue));
        }
      });
    }

    if (onValueChange) {
      const val = type === 'multiple' ? [...openValues] : [...openValues][0] ?? '';
      onValueChange(val);
    }
  }

  function updateItemState(triggerEl: HTMLButtonElement, contentEl: HTMLElement, chevronEl: SVGElement | null, open: boolean): void {
    triggerEl.setAttribute('aria-expanded', String(open));
    contentEl.hidden = !open;
    if (open) {
      contentEl.removeAttribute('data-state');
      contentEl.dataset.state = 'open';
      triggerEl.dataset.state = 'open';
      if (chevronEl) chevronEl.style.transform = 'rotate(180deg)';
    } else {
      contentEl.dataset.state = 'closed';
      triggerEl.dataset.state = 'closed';
      if (chevronEl) chevronEl.style.transform = '';
    }
  }

  items.forEach((item, idx) => {
    const itemEl = document.createElement('div');
    itemEl.dataset.slot = 'accordion-item';
    itemEl.className = 'border-b last:border-b-0';

    // Header
    const headerEl = document.createElement('h3');
    headerEl.className = 'flex';

    // Trigger
    const triggerId = `accordion-trigger-${item.value}`;
    const contentId = `accordion-content-${item.value}`;

    const triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.id = triggerId;
    triggerEl.dataset.slot = 'accordion-trigger';
    triggerEl.dataset.value = item.value;
    triggerEl.setAttribute('aria-controls', contentId);
    triggerEl.setAttribute('aria-expanded', 'false');
    triggerEl.className = TRIGGER_BASE;
    if (item.disabled) {
      triggerEl.disabled = true;
      triggerEl.className += ' opacity-50 pointer-events-none';
    }
    const triggerSpan = document.createElement('span');
    triggerSpan.textContent = item.trigger;
    triggerEl.appendChild(triggerSpan);
    triggerEl.insertAdjacentHTML('beforeend', CHEVRON_SVG);
    headerEl.appendChild(triggerEl);

    // Content
    const contentEl = document.createElement('div');
    contentEl.id = contentId;
    contentEl.dataset.slot = 'accordion-content';
    contentEl.setAttribute('data-content-for', item.value);
    contentEl.setAttribute('role', 'region');
    contentEl.setAttribute('aria-labelledby', triggerId);
    contentEl.className = 'overflow-hidden text-sm';
    contentEl.hidden = true;
    contentEl.dataset.state = 'closed';

    const innerEl = document.createElement('div');
    innerEl.className = 'pt-0 pb-4';
    innerEl.textContent = item.content;
    contentEl.appendChild(innerEl);

    const chevronEl = triggerEl.querySelector<SVGElement>('svg');

    // Set initial state
    if (isOpen(item.value)) {
      updateItemState(triggerEl, contentEl, chevronEl, true);
    }

    // Event
    if (!item.disabled) {
      triggerEl.addEventListener('click', () => toggle(item.value, triggerEl, contentEl, chevronEl));
    }

    // Keyboard nav: ArrowDown/ArrowUp
    triggerEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const allTriggers = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])'));
        const currentIdx = allTriggers.indexOf(triggerEl);
        const nextIdx = e.key === 'ArrowDown'
          ? (currentIdx + 1) % allTriggers.length
          : (currentIdx - 1 + allTriggers.length) % allTriggers.length;
        allTriggers[nextIdx]?.focus();
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
