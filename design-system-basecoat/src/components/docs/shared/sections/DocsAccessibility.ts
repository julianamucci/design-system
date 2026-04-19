import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';

export interface DocsKeyboardItem { key: string; description: string }
export interface DocsAccessibilityProps {
  title: string;
  summary: string;
  items: string[];
  keyboardTitle: string;
  keyboardItems: DocsKeyboardItem[];
}

export function createDocsAccessibility(props: DocsAccessibilityProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'acessibilidade';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = createCard({ className: 'p-4 space-y-6' });

  const summaryBlock = document.createElement('div');
  summaryBlock.className = 'space-y-4';
  summaryBlock.innerHTML = `
    <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(props.summary)}</p>
    <ul class="space-y-2 text-sm list-disc pl-5 marker:text-muted-foreground">
      ${props.items.map(item => `<li class="leading-relaxed">${sanitizeHtml(item)}</li>`).join('')}
    </ul>`;

  const keyboardBlock = document.createElement('div');
  keyboardBlock.innerHTML = `<h3 class="text-base font-semibold mb-3">${sanitizeHtml(props.keyboardTitle)}</h3>`;
  const kbGrid = document.createElement('div');
  kbGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  props.keyboardItems.forEach(item => {
    const card = createCard({ className: 'flex items-start gap-3 border-0 shadow-none bg-muted/30 rounded-lg p-4' });
    const kbd = document.createElement('kbd');
    kbd.className = 'inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm';
    kbd.textContent = item.key;
    const span = document.createElement('span');
    span.className = 'text-sm text-muted-foreground leading-relaxed';
    span.textContent = item.description;
    card.append(kbd, span);
    kbGrid.appendChild(card);
  });
  keyboardBlock.appendChild(kbGrid);

  container.append(summaryBlock, keyboardBlock);
  section.appendChild(container);
  return section;
}
