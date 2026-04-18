import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsPropItem {
  name: string; type: string; defaultValue: string; required: string; description: string;
}
export interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}
export interface DocsPropsProps {
  title: string;
  tables: DocsPropsTableDef[];
  interfaceCode?: string;
  extensibilityTitle?: string;
  extensibilityNotes?: string;
}

function renderTable(def: DocsPropsTableDef): string {
  return `
    ${def.title ? `<h3 class="text-base font-semibold">${sanitizeHtml(def.title)}</h3>` : ''}
    <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(def.cols.prop)}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(def.cols.type)}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(def.cols.default)}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(def.cols.required)}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(def.cols.description)}</th>
          </tr>
        </thead>
        <tbody>
          ${def.items.map(item => `
            <tr class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border font-mono font-bold text-primary">${sanitizeHtml(item.name)}</td>
              <td class="p-3 border-r border-border font-mono text-muted-foreground">${sanitizeHtml(item.type)}</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(item.defaultValue)}</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(item.required)}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(item.description)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

export function createDocsProps(props: DocsPropsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'propriedades';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-8';
  container.innerHTML = props.tables.map(renderTable).join('');

  if (props.interfaceCode) {
    container.innerHTML += `<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">${sanitizeHtml(props.interfaceCode)}</code></div>`;
  }

  if (props.extensibilityTitle) {
    container.innerHTML += `
      <div class="space-y-2">
        <h3 class="text-base font-semibold">${sanitizeHtml(props.extensibilityTitle)}</h3>
        ${props.extensibilityNotes ? `<div class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(props.extensibilityNotes)}</div>` : ''}
      </div>`;
  }

  section.appendChild(container);
  return section;
}
