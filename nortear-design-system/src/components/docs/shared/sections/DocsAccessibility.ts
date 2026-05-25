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
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = createCard({ className: 'nds-p-4 nds-stack' });
  container.dataset.spacing = 'lg';

  const summaryBlock = document.createElement('div');
  summaryBlock.className = 'nds-stack';
  summaryBlock.dataset.spacing = 'md';
  summaryBlock.innerHTML = `
    <p class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">${sanitizeHtml(props.summary)}</p>
    <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
      ${props.items.map(item => `<li class="nds-leading-relaxed">${sanitizeHtml(item)}</li>`).join('')}
    </ul>`;

  const keyboardBlock = document.createElement('div');
  keyboardBlock.innerHTML = `<h3 class="nds-text-base nds-font-semibold nds-mb-4">${sanitizeHtml(props.keyboardTitle)}</h3>`;
  const kbGrid = document.createElement('div');
  kbGrid.className = 'nds-grid';
  kbGrid.dataset.cols = '2';
  kbGrid.dataset.spacing = 'sm';
  props.keyboardItems.forEach(item => {
    const card = createCard({ className: 'nds-row nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4' });
    card.dataset.spacing = 'sm';
    card.dataset.align = 'start';
    const kbd = document.createElement('kbd');
    kbd.className = 'nds-kbd';
    kbd.textContent = item.key;
    const span = document.createElement('span');
    span.className = 'nds-text-body nds-text-muted-foreground nds-leading-relaxed';
    span.textContent = item.description;
    card.append(kbd, span);
    kbGrid.appendChild(card);
  });
  keyboardBlock.appendChild(kbGrid);

  container.append(summaryBlock, keyboardBlock);
  section.appendChild(container);
  return section;
}
