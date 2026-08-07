import DOMPurify from 'dompurify';
import { createCard } from '@/components/ui/card';

export interface DocsKeyboardItem { key: string; description: string }
export interface DocsAccessibilityProps {
  title: string;
  summary: string;
  items: string[];
  keyboardTitle: string;
  keyboardItems: DocsKeyboardItem[];
  /**
   * Anúncios de leitor de tela. As chaves de `accessibility.screenReader` variam
   * por componente (`closed/open/disabled`, `onOpen/onClose`, …), então o
   * container recebe só os valores — quem chama passa `Object.values(...)`.
   */
  screenReaderTitle?: string;
  screenReaderItems?: string[];
  /** Nota de contraste, quando o componente documenta uma. */
  contrast?: string;
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
    <p class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">${DOMPurify.sanitize(props.summary)}</p>
    <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
      ${props.items.map(item => `<li class="nds-leading-relaxed">${DOMPurify.sanitize(item)}</li>`).join('')}
    </ul>
    ${props.contrast ? `<p class="nds-text-body nds-leading-relaxed">${DOMPurify.sanitize(props.contrast)}</p>` : ''}`;

  const keyboardBlock = document.createElement('div');
  keyboardBlock.innerHTML = `<h3 class="nds-text-base nds-font-semibold nds-mb-4">${DOMPurify.sanitize(props.keyboardTitle)}</h3>`;
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

  const srItems = props.screenReaderItems ?? [];
  if (srItems.length > 0) {
    const srBlock = document.createElement('div');
    srBlock.innerHTML = `
      ${props.screenReaderTitle ? `<h3 class="nds-text-base nds-font-semibold nds-mb-4">${DOMPurify.sanitize(props.screenReaderTitle)}</h3>` : ''}
      <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
        ${srItems.map(item => `<li class="nds-leading-relaxed">${DOMPurify.sanitize(item)}</li>`).join('')}
      </ul>`;
    container.appendChild(srBlock);
  }

  section.appendChild(container);
  return section;
}
