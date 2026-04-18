import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsImportProps {
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
}

export function createDocsImport(props: DocsImportProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'importacao';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  if (props.description) {
    const p = document.createElement('p');
    p.className = 'text-sm text-muted-foreground mb-3';
    p.textContent = props.description;
    section.appendChild(p);
  }

  const codeBlock = document.createElement('div');
  codeBlock.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto';
  codeBlock.innerHTML = `<code class="whitespace-pre">${sanitizeHtml(props.code)}</code>`;
  section.appendChild(codeBlock);

  if (props.secondaryCode) {
    if (props.secondaryDescription) {
      const p2 = document.createElement('p');
      p2.className = 'text-sm text-muted-foreground mt-4 mb-3';
      p2.textContent = props.secondaryDescription;
      section.appendChild(p2);
    }
    const codeBlock2 = document.createElement('div');
    codeBlock2.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-3';
    codeBlock2.innerHTML = `<code class="whitespace-pre">${sanitizeHtml(props.secondaryCode)}</code>`;
    section.appendChild(codeBlock2);
  }

  return section;
}
