import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsAnalyticsEventItem { event: string; trigger: string; payload: string }
export interface DocsAnalyticsProps {
  title: string;
  cols: { event: string; trigger: string; payload: string };
  items: DocsAnalyticsEventItem[];
}

export function createDocsAnalytics(props: DocsAnalyticsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'analytics';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const wrapper = document.createElement('div');
  wrapper.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
  wrapper.innerHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border bg-muted/50 text-left">
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.event)}</th>
          <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.cols.trigger)}</th>
          <th class="p-3 font-semibold">${sanitizeHtml(props.cols.payload)}</th>
        </tr>
      </thead>
      <tbody>
        ${props.items.map(item => `
          <tr class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-mono text-primary">${sanitizeHtml(item.event)}</td>
            <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(item.trigger)}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(item.payload)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  section.append(h2, wrapper);
  return section;
}
