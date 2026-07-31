import DOMPurify from 'dompurify';
import { createComponentDemo } from '@/components/ComponentDemo';
import { createCodeBlock } from '@/components/ui/code-block';

export interface DocsAnatomyProps {
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
  /** Linguagem do snippet de estrutura, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function createDocsAnatomy(props: DocsAnatomyProps): HTMLElement {
  const { language = 'ts', copyLabel, copiedLabel } = props;

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
    li.className = 'nds-row nds-list-none';
    li.dataset.spacing = 'sm';
    li.dataset.align = 'start';
    li.innerHTML = `
      <span class="nds-pill" data-tone="primary">${i + 1}</span>
      <span>${DOMPurify.sanitize(item)}</span>`;
    ol.appendChild(li);
  });

  const structureWrap = document.createElement('div');
  if (props.structureLabel) {
    const label = document.createElement('p');
    label.className = 'nds-text-caption nds-text-muted-foreground nds-mb-2';
    label.textContent = props.structureLabel;
    structureWrap.appendChild(label);
  }
  structureWrap.appendChild(createCodeBlock({
    code: props.structureCode,
    language,
    showLineNumbers: false,
    copyLabel,
    copiedLabel,
  }));

  inner.append(ol, structureWrap);
  const demo = createComponentDemo(inner);
  section.append(h2, demo);
  return section;
}
