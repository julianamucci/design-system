import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsTokenItem { token: string; value: string; description: string }
export interface DocsTokensProps {
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
}

export function createDocsTokens(props: DocsTokensProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'tokens';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-6';

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
  tableWrapper.innerHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border bg-muted/50 text-left">
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.token)}</th>
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.value)}</th>
          <th class="p-3 font-semibold">${sanitizeHtml(props.cols.description)}</th>
        </tr>
      </thead>
      <tbody>
        ${props.items.map(item => `
          <tr class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-mono text-primary">${sanitizeHtml(item.token)}</td>
            <td class="p-3 border-r border-border font-mono text-muted-foreground">${sanitizeHtml(item.value)}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(item.description)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  container.appendChild(tableWrapper);

  if (props.customizationTitle) {
    const customBlock = document.createElement('div');
    customBlock.className = 'space-y-3';
    customBlock.innerHTML = `<h3 class="text-base font-semibold">${sanitizeHtml(props.customizationTitle)}</h3>`;
    if (props.customizationCode) {
      customBlock.innerHTML += `<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">${sanitizeHtml(props.customizationCode)}</code></div>`;
    }
    container.appendChild(customBlock);
  }

  section.appendChild(container);
  return section;
}
