import { sanitizeHtml } from '@/lib/sanitize-html';
import { createComponentDemo } from '@/components/ComponentDemo';

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
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const inner = document.createElement('div');
  inner.className = 'space-y-4 w-full';

  const ol = document.createElement('ol');
  ol.className = 'space-y-3 text-sm list-none p-0 m-0';
  props.items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'flex gap-3 list-none';
    li.innerHTML = `
      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i + 1}</span>
      <span>${sanitizeHtml(item)}</span>`;
    ol.appendChild(li);
  });

  const codeBlock = document.createElement('div');
  codeBlock.className = 'rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto';
  if (props.structureLabel) {
    const label = document.createElement('p');
    label.className = 'text-xs text-muted-foreground mb-2';
    label.textContent = props.structureLabel;
    codeBlock.appendChild(label);
  }
  const pre = document.createElement('pre');
  pre.className = 'font-mono text-sm whitespace-pre';
  pre.textContent = props.structureCode;
  codeBlock.appendChild(pre);

  inner.append(ol, codeBlock);
  const demo = createComponentDemo(inner);
  section.append(h2, demo);
  return section;
}
