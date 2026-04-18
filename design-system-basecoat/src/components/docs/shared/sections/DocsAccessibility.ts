import { sanitizeHtml } from '@/lib/sanitize-html';

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

  const container = document.createElement('div');
  container.className = 'space-y-6';

  const summaryBlock = document.createElement('div');
  summaryBlock.className = 'border rounded-xl p-6 shadow-sm space-y-4';
  summaryBlock.innerHTML = `
    <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(props.summary)}</p>
    <ul class="space-y-2 text-sm list-none p-0 m-0">
      ${props.items.map(item => `<li class="flex gap-2 list-none">${sanitizeHtml(item)}</li>`).join('')}
    </ul>`;

  const keyboardBlock = document.createElement('div');
  keyboardBlock.innerHTML = `<h3 class="text-base font-semibold mb-3">${sanitizeHtml(props.keyboardTitle)}</h3>`;
  const kbGrid = document.createElement('div');
  kbGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  props.keyboardItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'flex items-start gap-3 border rounded-lg p-3 bg-muted/30';
    card.innerHTML = `
      <kbd class="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm">${sanitizeHtml(item.key)}</kbd>
      <span class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(item.description)}</span>`;
    kbGrid.appendChild(card);
  });
  keyboardBlock.appendChild(kbGrid);

  container.append(summaryBlock, keyboardBlock);
  section.appendChild(container);
  return section;
}
