import { sanitizeHtml } from '@/lib/sanitize-html';
import { createComponentDemo } from '@/components/ComponentDemo';
import { createCard } from '@/components/ui/card';

export interface DocsAnatomyProps {
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
}

export function createDocsAnatomy(props: DocsAnatomyProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'anatomia';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const inner = document.createElement('div');
  inner.className = 'nds-stack nds-w-full';
  inner.dataset.spacing = 'md';

  const ol = document.createElement('ol');
  ol.className = 'nds-stack nds-text-body nds-list-none';
  ol.dataset.spacing = 'sm';
  props.items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'nds-row list-none';
    li.dataset.spacing = 'sm';
    li.dataset.align = 'start';
    li.innerHTML = `
      <span class="nds-pill" data-tone="primary">${i + 1}</span>
      <span>${sanitizeHtml(item)}</span>`;
    ol.appendChild(li);
  });

  const codeBlock = createCard({ className: 'nds-bg-muted-soft nds-border-soft nds-shadow-none nds-p-4 nds-overflow-x' });
  if (props.structureLabel) {
    const label = document.createElement('p');
    label.className = 'nds-text-caption nds-text-muted-foreground nds-mb-2';
    label.textContent = props.structureLabel;
    codeBlock.appendChild(label);
  }
  const pre = document.createElement('pre');
  pre.className = 'nds-font-mono nds-text-body nds-whitespace-pre';
  pre.textContent = props.structureCode;
  codeBlock.appendChild(pre);

  inner.append(ol, codeBlock);
  const demo = createComponentDemo(inner);
  section.append(h2, demo);
  return section;
}
