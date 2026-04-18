import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsExampleItem {
  title: string;
  description?: string;
  code: string;
  previewFactory: () => HTMLElement;
}

export interface DocsExamplesProps {
  title: string;
  items: DocsExampleItem[];
}

export function createDocsExamples(props: DocsExamplesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'exemplos';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-10';

  props.items.forEach(item => {
    const block = document.createElement('div');
    block.className = 'space-y-3';

    const h3 = document.createElement('h3');
    h3.className = 'text-base font-semibold';
    h3.textContent = item.title;
    block.appendChild(h3);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'text-sm text-muted-foreground';
      desc.textContent = item.description;
      block.appendChild(desc);
    }

    const preview = document.createElement('div');
    preview.className = 'flex items-center justify-center p-10 border rounded-xl bg-background shadow-sm';
    preview.appendChild(item.previewFactory());
    block.appendChild(preview);

    const toggleWrap = document.createElement('div');
    let codeVisible = false;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2';
    toggle.textContent = 'Ver código';

    const codeBlock = document.createElement('div');
    codeBlock.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2 hidden';
    codeBlock.innerHTML = `<code class="whitespace-pre">${sanitizeHtml(item.code)}</code>`;

    toggle.addEventListener('click', () => {
      codeVisible = !codeVisible;
      toggle.textContent = codeVisible ? 'Ocultar código' : 'Ver código';
      codeBlock.classList.toggle('hidden', !codeVisible);
    });

    toggleWrap.append(toggle, codeBlock);
    block.appendChild(toggleWrap);
    container.appendChild(block);
  });

  section.appendChild(container);
  return section;
}
