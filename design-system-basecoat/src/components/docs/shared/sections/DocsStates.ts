import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsStateItem { label: string; trigger: string; behavior: string }

export interface DocsStatesProps {
  title: string;
  cols: { state: string; trigger: string; behavior: string };
  items: DocsStateItem[];
}

export function createDocsStates(props: DocsStatesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'estados';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const wrapper = document.createElement('div');
  wrapper.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
  wrapper.innerHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border bg-muted/50 text-left">
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.state)}</th>
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.trigger)}</th>
          <th class="p-3 font-semibold">${sanitizeHtml(props.cols.behavior)}</th>
        </tr>
      </thead>
      <tbody>
        ${props.items.map(item => `
          <tr class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-medium">${sanitizeHtml(item.label)}</td>
            <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(item.trigger)}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(item.behavior)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  section.append(h2, wrapper);
  return section;
}
