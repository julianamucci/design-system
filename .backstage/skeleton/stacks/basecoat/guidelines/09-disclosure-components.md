# Disclosure Components (Basecoat — Vanilla TypeScript)

---

## Accordion

**Propósito**: mostrar e ocultar seções de conteúdo relacionado.

**Quando usar**: FAQs, configurações avançadas, conteúdo agrupável.

**Implementação**:
```ts
export interface AccordionItem {
  value: string;
  trigger: string;
  content: string | HTMLElement;
}

export interface AccordionOptions {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  collapsible?: boolean;
}

export function createAccordion({ items, type = 'single', collapsible = true }: AccordionOptions): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'w-full divide-y divide-border';
  container.setAttribute('data-type', type);

  const openItems = new Set<string>();

  items.forEach(({ value, trigger, content }) => {
    const item = document.createElement('div');
    item.setAttribute('data-value', value);

    const triggerId = `accordion-trigger-${value}`;
    const contentId = `accordion-content-${value}`;

    // Trigger
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = triggerId;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', contentId);
    btn.className = 'flex w-full items-center justify-between py-4 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    btn.textContent = trigger;

    const chevron = document.createElement('span');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.className = 'transition-transform duration-200 motion-reduce:transition-none';
    chevron.textContent = '↓';
    btn.appendChild(chevron);

    // Content
    const contentEl = document.createElement('div');
    contentEl.id = contentId;
    contentEl.setAttribute('role', 'region');
    contentEl.setAttribute('aria-labelledby', triggerId);
    contentEl.className = 'overflow-hidden';
    contentEl.hidden = true;

    const inner = document.createElement('div');
    inner.className = 'pb-4 pt-0';
    if (typeof content === 'string') {
      inner.textContent = content;
    } else {
      inner.appendChild(content);
    }
    contentEl.appendChild(inner);

    btn.addEventListener('click', () => {
      const isOpen = openItems.has(value);

      if (type === 'single') {
        openItems.clear();
        container.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
          el.setAttribute('aria-expanded', 'false');
          const panelId = el.getAttribute('aria-controls');
          if (panelId) {
            const panel = document.getElementById(panelId);
            if (panel) panel.hidden = true;
          }
        });
      }

      if (!isOpen || (isOpen && collapsible)) {
        const newOpen = !isOpen;
        btn.setAttribute('aria-expanded', newOpen ? 'true' : 'false');
        contentEl.hidden = !newOpen;
        if (newOpen) {
          openItems.add(value);
        } else {
          openItems.delete(value);
        }
      }
    });

    item.append(btn, contentEl);
    container.appendChild(item);
  });

  return container;
}
```

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):

Adicione as chamadas de `track` dentro do event listener de clique, antes da lógica de toggle:

```ts
import { track } from '@/lib/analytics';

btn.addEventListener('click', () => {
  const willOpen = !openItems.has(value);
  if (willOpen) {
    track('accordion_expand', { label: trigger });
  } else {
    track('accordion_collapse', { label: trigger });
  }
  // ... lógica de toggle existente
});
```

---

## Collapsible

**Propósito**: mostrar e ocultar um único bloco de conteúdo.

**Implementação**:
```ts
export interface CollapsibleOptions {
  trigger: HTMLElement;
  content: HTMLElement;
  open?: boolean;
  ariaLabel?: { open: string; close: string };
}

export function createCollapsible({ trigger, content, open = false, ariaLabel }: CollapsibleOptions): HTMLDivElement {
  const container = document.createElement('div');
  const contentId = `collapsible-${Math.random().toString(36).slice(2)}`;

  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  trigger.setAttribute('aria-controls', contentId);

  content.id = contentId;
  content.hidden = !open;

  if (ariaLabel) {
    trigger.setAttribute('aria-label', open ? ariaLabel.close : ariaLabel.open);
  }

  trigger.addEventListener('click', () => {
    const isOpen = content.hidden === false;
    content.hidden = isOpen;
    trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    if (ariaLabel) {
      trigger.setAttribute('aria-label', isOpen ? ariaLabel.open : ariaLabel.close);
    }
  });

  container.append(trigger, content);
  return container;
}
```
